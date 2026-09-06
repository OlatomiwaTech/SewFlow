import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";

import prisma from "../lib/prisma.js";
import { deleteMaterial } from "../services/inventory.service.js";
import { formatOrderMaterialSummary } from "../services/order-material.service.js";

describe("Historical Data Safety Regression Test", () => {
  const businessId = "biz-hist-1111";
  const materialId = "mat-hist-1111";

  test("deleting a material soft-deactivates it (isActive: false) to preserve historical OrderMaterial data", async () => {
    let capturedData: any = null;
    (prisma.material.findFirst as any) = async () => ({
      id: materialId,
      businessId,
      isActive: true,
    });

    (prisma.material.update as any) = async (args: any) => {
      capturedData = args.data;
      return { id: materialId, businessId, isActive: false };
    };

    const result = await deleteMaterial(businessId, materialId);

    assert.equal(capturedData.isActive, false, "Material deletion must perform soft-deactivation (isActive: false)");
    assert.equal(result.isActive, false);
  });

  test("historical OrderMaterial summary retains snapshotted unitCost and totalCost even if Material price changes", () => {
    const historicalOrderMaterial: any = {
      id: "om-hist-1",
      orderId: "ord-hist-1",
      materialId: materialId,
      plannedQuantity: new Prisma.Decimal(5),
      actualQuantity: new Prisma.Decimal(4),
      unit: "YARD",
      unitCost: new Prisma.Decimal(2500), // Snapshotted cost at time of usage
      totalCost: new Prisma.Decimal(10000), // 4 * 2500 = 10000
      notes: "Historical order in 2024",
      createdAt: new Date(),
      updatedAt: new Date(),
      material: {
        id: materialId,
        name: "Italian Silk",
        category: "FABRIC",
        unit: "YARD",
        currentQuantity: new Prisma.Decimal(15),
        minimumStockLevel: new Prisma.Decimal(2),
        costPerUnit: new Prisma.Decimal(4500), // Price increased in 2026 to 4500
        isActive: false, // Soft-deactivated
      },
    };

    const summary = formatOrderMaterialSummary(historicalOrderMaterial);

    assert.equal(summary.unitCost, 2500, "Historical unitCost must remain snapshotted at 2500");
    assert.equal(summary.totalCost, 10000, "Historical totalCost must remain 10000 regardless of current material price changes");
    assert.equal(summary.material?.isActive, false, "Material remains soft-deactivated without breaking OrderMaterial relation");
  });
});
