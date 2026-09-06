import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";

import prisma from "../lib/prisma.js";
import { recordActualConsumption } from "../services/order-material.service.js";

describe("Concurrency-Safe Inventory Consumption & Audit Trail Test", () => {
  const businessId = "biz-concurrency-1111";
  const customerId = "cust-concurrency-1111";
  const orderId1 = "ord-concurrency-1";
  const orderId2 = "ord-concurrency-2";
  const orderMaterialId1 = "om-conc-1";
  const orderMaterialId2 = "om-conc-2";
  const materialId = "mat-conc-1";

  test("two concurrent consumption requests BOTH succeed and create a continuous StockMovement audit chain", async () => {
    (prisma.customer.findFirst as any) = async () => ({ id: customerId, businessId });
    (prisma.order.findFirst as any) = async () => ({ id: orderId1, customerId });

    let currentStock = 10; // Initial stock = 10 yards
    const stockMovementsCreated: any[] = [];

    const mockTx = {
      orderMaterial: {
        findFirst: async (args: any) => ({
          id: args.where.id,
          orderId: args.where.orderId || orderId1,
          materialId,
          actualQuantity: new Prisma.Decimal(0),
          unitCost: new Prisma.Decimal(2000),
        }),
        update: async (args: any) => ({
          id: args.where.id,
          orderId: args.where.orderId || orderId1,
          materialId,
          plannedQuantity: new Prisma.Decimal(5),
          actualQuantity: args.data.actualQuantity,
          unit: "YARD",
          unitCost: new Prisma.Decimal(2000),
          totalCost: args.data.totalCost,
          material: { id: materialId, name: "Velvet", currentQuantity: new Prisma.Decimal(currentStock) },
        }),
      },
      material: {
        findFirst: async () => ({
          id: materialId,
          businessId,
          name: "Velvet",
          unit: "YARD",
          currentQuantity: new Prisma.Decimal(currentStock),
        }),
        update: async (args: any) => {
          currentStock = Number(args.data.currentQuantity);
        },
      },
      stockMovement: {
        create: async (args: any) => {
          stockMovementsCreated.push(args.data);
        },
      },
    };

    (prisma.$transaction as any) = async (callback: any) => callback(mockTx);

    // Simulate 2 sequential or atomic concurrent consumption operations of 3 yards each
    const res1 = await recordActualConsumption(businessId, customerId, orderId1, orderMaterialId1, { actualQuantity: 3 });
    const res2 = await recordActualConsumption(businessId, customerId, orderId2, orderMaterialId2, { actualQuantity: 3 });

    assert.equal(currentStock, 4, "Final inventory stock must be exactly 4 (10 - 3 - 3 = 4)");
    assert.equal(res1.actualQuantity, 3);
    assert.equal(res2.actualQuantity, 3);

    assert.equal(stockMovementsCreated.length, 2, "Both operations must create distinct StockMovement records");

    const move1 = stockMovementsCreated[0];
    const move2 = stockMovementsCreated[1];

    assert.equal(Number(move1.quantityBefore), 10);
    assert.equal(Number(move1.quantityAfter), 7);

    assert.equal(Number(move2.quantityBefore), 7, "Second movement 'quantityBefore' must form a valid chain from first movement 'quantityAfter'");
    assert.equal(Number(move2.quantityAfter), 4);
  });

  test("competing concurrent consumption requests prevent negative stock when stock is insufficient", async () => {
    (prisma.customer.findFirst as any) = async () => ({ id: customerId, businessId });
    (prisma.order.findFirst as any) = async () => ({ id: orderId1, customerId });

    let currentStock = 5; // Only 5 yards available in stock

    const mockTx = {
      orderMaterial: {
        findFirst: async (args: any) => ({
          id: args.where.id,
          orderId: orderId1,
          materialId,
          actualQuantity: new Prisma.Decimal(0),
          unitCost: new Prisma.Decimal(2000),
        }),
        update: async (args: any) => ({
          id: args.where.id,
          orderId: orderId1,
          materialId,
          plannedQuantity: new Prisma.Decimal(4),
          actualQuantity: args.data.actualQuantity,
          unit: "YARD",
          unitCost: new Prisma.Decimal(2000),
          totalCost: args.data.totalCost,
          material: { id: materialId, name: "Silk", currentQuantity: new Prisma.Decimal(currentStock) },
        }),
      },
      material: {
        findFirst: async () => ({
          id: materialId,
          businessId,
          name: "Silk",
          unit: "YARD",
          currentQuantity: new Prisma.Decimal(currentStock),
        }),
        update: async (args: any) => {
          currentStock = Number(args.data.currentQuantity);
        },
      },
      stockMovement: {
        create: async () => {},
      },
    };

    (prisma.$transaction as any) = async (callback: any) => callback(mockTx);

    // First request consumes 4 yards (stock becomes 1)
    await recordActualConsumption(businessId, customerId, orderId1, orderMaterialId1, { actualQuantity: 4 });
    assert.equal(currentStock, 1);

    // Second request attempts to consume 4 yards when only 1 is left
    await assert.rejects(
      async () => {
        await recordActualConsumption(businessId, customerId, orderId1, orderMaterialId2, { actualQuantity: 4 });
      },
      (err: any) => err.name === "VALIDATION_ERROR" && err.message.includes("Insufficient stock"),
    );

    assert.equal(currentStock, 1, "Final stock must remain 1 and never negative");
  });
});
