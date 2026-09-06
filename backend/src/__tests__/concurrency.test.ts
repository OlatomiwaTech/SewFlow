import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";

import prisma from "../lib/prisma.js";
import { recordActualConsumption } from "../services/order-material.service.js";

describe("Concurrency-Safe Inventory Consumption Test", () => {
  const businessId = "biz-concurrency-1111";
  const customerId = "cust-concurrency-1111";
  const orderId = "ord-concurrency-1111";
  const orderMaterialId1 = "om-conc-1";
  const orderMaterialId2 = "om-conc-2";
  const materialId = "mat-conc-1";

  test("competing concurrent consumption requests prevent negative stock and double-deduction", async () => {
    (prisma.customer.findFirst as any) = async () => ({ id: customerId, businessId });
    (prisma.order.findFirst as any) = async () => ({ id: orderId, customerId });

    let currentInventoryStock = 10; // Only 10 yards available in stock

    const mockTx = {
      orderMaterial: {
        findFirst: async (args: any) => ({
          id: args.where.id,
          orderId,
          materialId,
          actualQuantity: new Prisma.Decimal(0),
          unitCost: new Prisma.Decimal(2000),
        }),
        update: async (args: any) => ({
          id: args.where.id,
          orderId,
          materialId,
          plannedQuantity: new Prisma.Decimal(7),
          actualQuantity: args.data.actualQuantity,
          unit: "YARD",
          unitCost: new Prisma.Decimal(2000),
          totalCost: args.data.totalCost,
          material: { id: materialId, name: "Silk", currentQuantity: new Prisma.Decimal(currentInventoryStock) },
        }),
      },
      material: {
        findFirst: async () => ({
          id: materialId,
          businessId,
          name: "Silk",
          unit: "YARD",
          currentQuantity: new Prisma.Decimal(currentInventoryStock),
        }),
        updateMany: async (args: any) => {
          const requestedDecrement = Number(args.where.currentQuantity.gte);
          if (currentInventoryStock >= requestedDecrement) {
            currentInventoryStock -= requestedDecrement;
            return { count: 1 };
          }
          return { count: 0 }; // Atomic update failed due to insufficient stock
        },
      },
      stockMovement: {
        create: async () => {},
      },
    };

    (prisma.$transaction as any) = async (callback: any) => callback(mockTx);

    // Run 2 competing requests concurrently trying to consume 7 yards each (total 14 > 10 available)
    const results = await Promise.allSettled([
      recordActualConsumption(businessId, customerId, orderId, orderMaterialId1, { actualQuantity: 7 }),
      recordActualConsumption(businessId, customerId, orderId, orderMaterialId2, { actualQuantity: 7 }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    assert.equal(fulfilled.length, 1, "Exactly one concurrent request must succeed");
    assert.equal(rejected.length, 1, "The second concurrent request must be rejected due to insufficient stock");

    const rejectionError = (rejected[0] as PromiseRejectedResult).reason;
    assert.equal(rejectionError.name, "VALIDATION_ERROR");
    assert.ok(rejectionError.message.includes("Insufficient stock"));

    assert.equal(currentInventoryStock, 3, "Final inventory stock must be exactly 3 (10 - 7 = 3) and never negative");
  });
});
