import { MovementType, Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import type {
  AddPlannedMaterialInput,
  RecordActualConsumptionInput,
  UpdateOrderMaterialInput,
} from "../validators/order-material.validator.js";

async function verifyOrderOwnership(
  businessId: string,
  customerId: string,
  orderId: string,
) {
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      businessId,
    },
    select: { id: true },
  });

  if (!customer) {
    const error = new Error("Customer not found.");
    error.name = "NOT_FOUND";
    throw error;
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      customerId,
    },
    select: { id: true },
  });

  if (!order) {
    const error = new Error("Order not found.");
    error.name = "NOT_FOUND";
    throw error;
  }

  return order;
}

export function formatOrderMaterialSummary(
  item: Prisma.OrderMaterialGetPayload<{
    include: { material: true };
  }>,
) {
  const plannedQuantity = Math.round(Number(item.plannedQuantity) * 100) / 100;
  const actualQuantity = Math.round(Number(item.actualQuantity) * 100) / 100;
  const unitCost = Math.round(Number(item.unitCost) * 100) / 100;
  const totalCost = Math.round(Number(item.totalCost) * 100) / 100;

  return {
    ...item,
    plannedQuantity,
    actualQuantity,
    unitCost,
    totalCost,
    material: item.material
      ? {
          ...item.material,
          currentQuantity: Math.round(Number(item.material.currentQuantity) * 100) / 100,
          minimumStockLevel: Math.round(Number(item.material.minimumStockLevel) * 100) / 100,
          costPerUnit: Math.round(Number(item.material.costPerUnit) * 100) / 100,
        }
      : item.material,
  };
}

export async function listOrderMaterials(
  businessId: string,
  customerId: string,
  orderId: string,
) {
  await verifyOrderOwnership(businessId, customerId, orderId);

  const materials = await prisma.orderMaterial.findMany({
    where: {
      orderId,
    },
    include: {
      material: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return materials.map(formatOrderMaterialSummary);
}

export async function addPlannedMaterial(
  businessId: string,
  customerId: string,
  orderId: string,
  input: AddPlannedMaterialInput,
) {
  await verifyOrderOwnership(businessId, customerId, orderId);

  const material = await prisma.material.findFirst({
    where: {
      id: input.materialId,
      businessId,
    },
  });

  if (!material) {
    const error = new Error("Material not found or belongs to another business.");
    error.name = "NOT_FOUND";
    throw error;
  }

  const plannedQty = Math.round(input.plannedQuantity * 100) / 100;
  const unitCost = Math.round(Number(material.costPerUnit) * 100) / 100;

  const created = await prisma.orderMaterial.create({
    data: {
      orderId,
      materialId: material.id,
      plannedQuantity: new Prisma.Decimal(plannedQty),
      actualQuantity: new Prisma.Decimal(0),
      unit: material.unit,
      unitCost: new Prisma.Decimal(unitCost),
      totalCost: new Prisma.Decimal(0),
      notes: input.notes?.trim() || null,
    },
    include: {
      material: true,
    },
  });

  return formatOrderMaterialSummary(created);
}

export async function updateOrderMaterial(
  businessId: string,
  customerId: string,
  orderId: string,
  orderMaterialId: string,
  input: UpdateOrderMaterialInput,
) {
  await verifyOrderOwnership(businessId, customerId, orderId);

  const existing = await prisma.orderMaterial.findFirst({
    where: {
      id: orderMaterialId,
      orderId,
    },
  });

  if (!existing) {
    const error = new Error("Order material record not found.");
    error.name = "NOT_FOUND";
    throw error;
  }

  const updatedPlanned =
    input.plannedQuantity !== undefined
      ? Math.round(input.plannedQuantity * 100) / 100
      : Number(existing.plannedQuantity);

  const updated = await prisma.orderMaterial.update({
    where: {
      id: existing.id,
    },
    data: {
      plannedQuantity: new Prisma.Decimal(updatedPlanned),
      ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
    },
    include: {
      material: true,
    },
  });

  return formatOrderMaterialSummary(updated);
}

export async function recordActualConsumption(
  businessId: string,
  customerId: string,
  orderId: string,
  orderMaterialId: string,
  input: RecordActualConsumptionInput,
  userId?: string,
) {
  await verifyOrderOwnership(businessId, customerId, orderId);

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.orderMaterial.findFirst({
      where: {
        id: orderMaterialId,
        orderId,
      },
    });

    if (!existing) {
      const error = new Error("Order material record not found.");
      error.name = "NOT_FOUND";
      throw error;
    }

    const material = await tx.material.findFirst({
      where: {
        id: existing.materialId,
        businessId,
      },
    });

    if (!material) {
      const error = new Error("Material not found.");
      error.name = "NOT_FOUND";
      throw error;
    }

    const oldActual = Math.round(Number(existing.actualQuantity) * 100) / 100;
    const newActual = Math.round(input.actualQuantity * 100) / 100;
    const delta = Math.round((newActual - oldActual) * 100) / 100;

    if (delta !== 0) {
      const currentQty = Math.round(Number(material.currentQuantity) * 100) / 100;
      const newQty = Math.round((currentQty - delta) * 100) / 100;

      if (newQty < 0) {
        const error = new Error(
          `Insufficient stock for material '${material.name}'. Current stock is ${currentQty} ${material.unit}, requested additional consumption is ${delta} ${material.unit}.`,
        );
        error.name = "VALIDATION_ERROR";
        throw error;
      }

      await tx.material.update({
        where: { id: material.id },
        data: {
          currentQuantity: new Prisma.Decimal(newQty),
        },
      });

      await tx.stockMovement.create({
        data: {
          materialId: material.id,
          orderId,
          type: delta > 0 ? MovementType.USAGE : MovementType.RETURN,
          quantityChange: new Prisma.Decimal(-delta),
          quantityBefore: new Prisma.Decimal(currentQty),
          quantityAfter: new Prisma.Decimal(newQty),
          notes: input.notes?.trim() || `Material consumption update for Order #${orderId.slice(0, 8)}`,
          createdById: userId || null,
        },
      });
    }

    const unitCost = Number(existing.unitCost);
    const totalCost = Math.round(newActual * unitCost * 100) / 100;

    const updated = await tx.orderMaterial.update({
      where: { id: existing.id },
      data: {
        actualQuantity: new Prisma.Decimal(newActual),
        totalCost: new Prisma.Decimal(totalCost),
        ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
      },
      include: {
        material: true,
      },
    });

    return updated;
  });

  return formatOrderMaterialSummary(result);
}

export async function deleteOrderMaterial(
  businessId: string,
  customerId: string,
  orderId: string,
  orderMaterialId: string,
  userId?: string,
) {
  await verifyOrderOwnership(businessId, customerId, orderId);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.orderMaterial.findFirst({
      where: {
        id: orderMaterialId,
        orderId,
      },
    });

    if (!existing) {
      const error = new Error("Order material record not found.");
      error.name = "NOT_FOUND";
      throw error;
    }

    const actualQty = Math.round(Number(existing.actualQuantity) * 100) / 100;

    // Restore stock if actual quantity was previously consumed
    if (actualQty > 0) {
      const material = await tx.material.findFirst({
        where: { id: existing.materialId, businessId },
      });

      if (material) {
        const currentQty = Math.round(Number(material.currentQuantity) * 100) / 100;
        const restoredQty = Math.round((currentQty + actualQty) * 100) / 100;

        await tx.material.update({
          where: { id: material.id },
          data: { currentQuantity: new Prisma.Decimal(restoredQty) },
        });

        await tx.stockMovement.create({
          data: {
            materialId: material.id,
            orderId,
            type: MovementType.RETURN,
            quantityChange: new Prisma.Decimal(actualQty),
            quantityBefore: new Prisma.Decimal(currentQty),
            quantityAfter: new Prisma.Decimal(restoredQty),
            notes: `Stock restored from deleted Order Material record for Order #${orderId.slice(0, 8)}`,
            createdById: userId || null,
          },
        });
      }
    }

    return tx.orderMaterial.delete({
      where: { id: existing.id },
    });
  });
}
