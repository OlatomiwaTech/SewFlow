import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";

import prisma from "../lib/prisma.js";
import {
  addPlannedMaterial,
  deleteOrderMaterial,
  recordActualConsumption,
  updateOrderMaterial,
} from "../services/order-material.service.js";
import { addPlannedMaterialSchema, recordActualConsumptionSchema } from "../validators/order-material.validator.js";

describe("Order Material Usage & Inventory Integration Audit", () => {
  const businessA = "biz-aaaa-1111-2222-333344445555";
  const businessB = "biz-bbbb-1111-2222-333344445555";

  const customerIdA = "cust-aaaa-1111-2222-333344445555";
  const orderIdA = "ord-aaaa-1111-2222-333344445555";

  const materialIdA = "mat-aaaa-1111-2222-333344445555";
  const materialIdB = "mat-bbbb-9999-8888-777766665555";
  const orderMaterialIdA = "om-aaaa-1111-2222-333344445555";

  test("addPlannedMaterialSchema rejects zero or negative planned quantity", () => {
    assert.throws(() => {
      addPlannedMaterialSchema.parse({
        materialId: materialIdA,
        plannedQuantity: 0,
      });
    });

    assert.throws(() => {
      addPlannedMaterialSchema.parse({
        materialId: materialIdA,
        plannedQuantity: -5,
      });
    });
  });

  test("recordActualConsumptionSchema rejects negative actual quantity", () => {
    assert.throws(() => {
      recordActualConsumptionSchema.parse({
        actualQuantity: -2,
      });
    });

    const valid = recordActualConsumptionSchema.parse({
      actualQuantity: 3.5,
      notes: "Used 3.5 meters for dress",
    });
    assert.equal(valid.actualQuantity, 3.5);
  });

  test("addPlannedMaterial snapshots unit & unitCost and does NOT deduct stock", async () => {
    (prisma.customer.findFirst as any) = async () => ({ id: customerIdA, businessId: businessA });
    (prisma.order.findFirst as any) = async () => ({ id: orderIdA, customerId: customerIdA });

    let stockUpdated = false;
    (prisma.material.findFirst as any) = async () => ({
      id: materialIdA,
      businessId: businessA,
      name: "Gold Silk",
      unit: "YARD",
      costPerUnit: new Prisma.Decimal(5000),
      currentQuantity: new Prisma.Decimal(20),
    });

    let createdOrderMaterialData: any = null;
    (prisma.orderMaterial.create as any) = async (args: any) => {
      createdOrderMaterialData = args.data;
      return {
        id: orderMaterialIdA,
        orderId: orderIdA,
        materialId: materialIdA,
        plannedQuantity: args.data.plannedQuantity,
        actualQuantity: new Prisma.Decimal(0),
        unit: args.data.unit,
        unitCost: args.data.unitCost,
        totalCost: new Prisma.Decimal(0),
        notes: args.data.notes,
        material: { id: materialIdA, name: "Gold Silk", currentQuantity: new Prisma.Decimal(20), minimumStockLevel: new Prisma.Decimal(2), costPerUnit: new Prisma.Decimal(5000) },
      };
    };

    (prisma.material.update as any) = async () => {
      stockUpdated = true;
    };

    const result = await addPlannedMaterial(businessA, customerIdA, orderIdA, {
      materialId: materialIdA,
      plannedQuantity: 4.5,
      notes: "Estimated 4.5 yards",
    });

    assert.equal(stockUpdated, false, "Planned material must NOT deduct inventory stock");
    assert.equal(result.plannedQuantity, 4.5);
    assert.equal(result.actualQuantity, 0);
    assert.equal(result.unitCost, 5000);
    assert.equal(result.totalCost, 0);
  });

  test("Cross-Business Isolation: Rejects linking Material from Business B to Order of Business A", async () => {
    (prisma.customer.findFirst as any) = async () => ({ id: customerIdA, businessId: businessA });
    (prisma.order.findFirst as any) = async () => ({ id: orderIdA, customerId: customerIdA });

    // Material B belongs to businessB, so finding material with businessA returns null
    (prisma.material.findFirst as any) = async (args: any) => {
      if (args.where.businessId === businessA) {
        return null;
      }
      return { id: materialIdB, businessId: businessB };
    };

    await assert.rejects(
      async () => {
        await addPlannedMaterial(businessA, customerIdA, orderIdA, {
          materialId: materialIdB,
          plannedQuantity: 2,
        });
      },
      (err: any) => err.name === "NOT_FOUND" && err.message.includes("belongs to another business"),
    );
  });

  test("recordActualConsumption deducts stock and logs StockMovement inside transaction", async () => {
    (prisma.customer.findFirst as any) = async () => ({ id: customerIdA, businessId: businessA });
    (prisma.order.findFirst as any) = async () => ({ id: orderIdA, customerId: customerIdA });

    let updatedStock: any = null;
    let createdStockMovement: any = null;

    const mockTx = {
      orderMaterial: {
        findFirst: async () => ({
          id: orderMaterialIdA,
          orderId: orderIdA,
          materialId: materialIdA,
          actualQuantity: new Prisma.Decimal(0),
          unitCost: new Prisma.Decimal(2500),
        }),
        update: async (args: any) => ({
          id: orderMaterialIdA,
          orderId: orderIdA,
          materialId: materialIdA,
          plannedQuantity: new Prisma.Decimal(4),
          actualQuantity: args.data.actualQuantity,
          unit: "YARD",
          unitCost: new Prisma.Decimal(2500),
          totalCost: args.data.totalCost,
          notes: args.data.notes,
          material: { id: materialIdA, name: "Cotton", currentQuantity: new Prisma.Decimal(6), minimumStockLevel: new Prisma.Decimal(1), costPerUnit: new Prisma.Decimal(2500) },
        }),
      },
      material: {
        findFirst: async () => ({
          id: materialIdA,
          businessId: businessA,
          name: "Cotton",
          unit: "YARD",
          currentQuantity: new Prisma.Decimal(10),
        }),
        update: async (args: any) => {
          updatedStock = args.data.currentQuantity;
        },
      },
      stockMovement: {
        create: async (args: any) => {
          createdStockMovement = args.data;
        },
      },
    };

    (prisma.$transaction as any) = async (callback: any) => callback(mockTx);

    const result = await recordActualConsumption(businessA, customerIdA, orderIdA, orderMaterialIdA, {
      actualQuantity: 4,
      notes: "Consumed 4 yards",
    });

    assert.equal(Number(updatedStock), 6, "Stock must be deducted by 4 (10 - 4 = 6)");
    assert.equal(createdStockMovement.orderId, orderIdA);
    assert.equal(Number(createdStockMovement.quantityChange), -4);
    assert.equal(result.actualQuantity, 4);
    assert.equal(result.totalCost, 10000); // 4 * 2500 = 10000
  });

  test("recordActualConsumption rejects consumption exceeding available stock", async () => {
    (prisma.customer.findFirst as any) = async () => ({ id: customerIdA, businessId: businessA });
    (prisma.order.findFirst as any) = async () => ({ id: orderIdA, customerId: customerIdA });

    const mockTx = {
      orderMaterial: {
        findFirst: async () => ({
          id: orderMaterialIdA,
          orderId: orderIdA,
          materialId: materialIdA,
          actualQuantity: new Prisma.Decimal(0),
          unitCost: new Prisma.Decimal(2500),
        }),
      },
      material: {
        findFirst: async () => ({
          id: materialIdA,
          businessId: businessA,
          name: "Cotton",
          unit: "YARD",
          currentQuantity: new Prisma.Decimal(2), // Only 2 yards in stock
        }),
      },
    };

    (prisma.$transaction as any) = async (callback: any) => callback(mockTx);

    await assert.rejects(
      async () => {
        await recordActualConsumption(businessA, customerIdA, orderIdA, orderMaterialIdA, {
          actualQuantity: 5, // Requesting 5 yards when only 2 available
        });
      },
      (err: any) => err.name === "VALIDATION_ERROR" && err.message.includes("Insufficient stock"),
    );
  });
});
