import Decimal from "decimal.js";
import { MovementType, Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
  AdjustStockInput,
  CreateMaterialInput,
  MaterialQueryInput,
  UpdateMaterialInput,
} from "../validators/inventory.validator.js";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

const toDecimal = (value: number | string | Prisma.Decimal): Decimal =>
  new Decimal(value.toString());

const toMoney = (value: number | string | Prisma.Decimal): number =>
  Number(toDecimal(value).toFixed(2));

export function getStockStatus(
  currentQuantity: number,
  minimumStockLevel: number,
): StockStatus {
  if (currentQuantity <= 0) {
    return "OUT_OF_STOCK";
  }
  if (currentQuantity <= minimumStockLevel) {
    return "LOW_STOCK";
  }
  return "IN_STOCK";
}

export function formatMaterialSummary(
  material: Prisma.MaterialGetPayload<{
    include: { stockMovements: true };
  }>,
) {
  const currentQuantity = toMoney(material.currentQuantity);
  const minimumStockLevel = toMoney(material.minimumStockLevel);
  const costPerUnit = toMoney(material.costPerUnit);

  const stockStatus = getStockStatus(currentQuantity, minimumStockLevel);
  const estimatedValue = Math.max(0, Number(new Decimal(currentQuantity).mul(costPerUnit).toFixed(2)));

  return {
    ...material,
    currentQuantity,
    minimumStockLevel,
    costPerUnit,
    stockStatus,
    estimatedValue,
    stockMovements: material.stockMovements
      ? material.stockMovements.map((movement) => ({
          ...movement,
          quantityChange: toMoney(movement.quantityChange),
          quantityBefore: toMoney(movement.quantityBefore),
          quantityAfter: toMoney(movement.quantityAfter),
        }))
      : [],
  };
}

export async function listMaterials(businessId: string, query?: MaterialQueryInput) {
  const whereClause: Prisma.MaterialWhereInput = {
    businessId,
    deletedAt: null,
  };

  if (query?.isActive !== undefined) {
    whereClause.isActive = query.isActive;
  }

  if (query?.category) {
    whereClause.category = query.category;
  }

  if (query?.search) {
    const search = query.search.trim();
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const materials = await prisma.material.findMany({
    where: whereClause,
    include: {
      stockMovements: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = materials.map(formatMaterialSummary);

  if (query?.status && query.status !== "ALL") {
    return formatted.filter((material) => material.stockStatus === query.status);
  }

  return formatted;
}

export async function getMaterial(businessId: string, materialId: string) {
  const material = await prisma.material.findFirst({
    where: {
      id: materialId,
      businessId,
      deletedAt: null,
    },
    include: {
      stockMovements: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!material) {
    throw new AppError("Material not found.", 404, true, "NOT_FOUND");
  }

  return formatMaterialSummary(material);
}

export async function createMaterial(
  businessId: string,
  input: CreateMaterialInput,
  userId?: string,
) {
  if (input.sku) {
    const existingSku = await prisma.material.findFirst({
      where: {
        businessId,
        sku: input.sku.trim(),
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existingSku) {
      throw new AppError(`Material SKU '${input.sku}' is already in use.`, 409, true, "CONFLICT");
    }
  }

  const initialQuantity = toDecimal(input.initialQuantity ?? 0).toDecimalPlaces(2);
  const minimumStockLevel = toDecimal(input.minimumStockLevel ?? 0).toDecimalPlaces(2);
  const costPerUnit = toDecimal(input.costPerUnit ?? 0).toDecimalPlaces(2);

  const result = await prisma.$transaction(async (tx) => {
    const material = await tx.material.create({
      data: {
        businessId,
        name: input.name.trim(),
        sku: input.sku?.trim() || null,
        description: input.description?.trim() || null,
        category: input.category,
        unit: input.unit,
        currentQuantity: new Prisma.Decimal(initialQuantity.toFixed(2)),
        minimumStockLevel: new Prisma.Decimal(minimumStockLevel.toFixed(2)),
        costPerUnit: new Prisma.Decimal(costPerUnit.toFixed(2)),
        ...(initialQuantity.gt(0) && {
          stockMovements: {
            create: {
              businessId,
              type: MovementType.INITIAL_STOCK,
              quantityChange: new Prisma.Decimal(initialQuantity.toFixed(2)),
              quantityBefore: new Prisma.Decimal("0.00"),
              quantityAfter: new Prisma.Decimal(initialQuantity.toFixed(2)),
              notes: "Initial stock created",
              createdById: userId ?? null,
            },
          },
        }),
      },
      include: {
        stockMovements: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
    return material;
  });

  return formatMaterialSummary(result);
}

export async function updateMaterial(
  businessId: string,
  materialId: string,
  input: UpdateMaterialInput,
) {
  const existing = await prisma.material.findFirst({
    where: {
      id: materialId,
      businessId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new AppError("Material not found.", 404, true, "NOT_FOUND");
  }

  if (input.sku && input.sku.trim() !== existing.sku) {
    const duplicateSku = await prisma.material.findFirst({
      where: {
        businessId,
        sku: input.sku.trim(),
        id: { not: materialId },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (duplicateSku) {
      throw new AppError(`Material SKU '${input.sku}' is already in use.`, 409, true, "CONFLICT");
    }
  }

  const updated = await prisma.material.update({
    where: { id: materialId },
    data: {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.sku !== undefined && { sku: input.sku?.trim() || null }),
      ...(input.description !== undefined && {
        description: input.description?.trim() || null,
      }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.unit !== undefined && { unit: input.unit }),
      ...(input.minimumStockLevel !== undefined && {
        minimumStockLevel: new Prisma.Decimal(toDecimal(input.minimumStockLevel).toFixed(2)),
      }),
      ...(input.costPerUnit !== undefined && {
        costPerUnit: new Prisma.Decimal(toDecimal(input.costPerUnit).toFixed(2)),
      }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
    include: {
      stockMovements: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return formatMaterialSummary(updated);
}

export async function deductStock(
  businessId: string,
  materialId: string,
  requestedQuantity: number,
  metadata?: {
    orderId?: string;
    userId?: string;
    notes?: string;
  },
) {
  const requested = toDecimal(requestedQuantity).toDecimalPlaces(2);

  if (!requested.isFinite() || requested.lte(0)) {
    throw new AppError("Requested quantity must be greater than zero.", 400, true, "VALIDATION_ERROR");
  }

  return prisma.$transaction(async (tx) => {
    const material = await tx.material.findFirst({
      where: {
        id: materialId,
        businessId,
        deletedAt: null,
      },
    });

    if (!material) {
      throw new AppError("Material not found.", 404, true, "NOT_FOUND");
    }

    const currentQuantity = toDecimal(material.currentQuantity);

    if (currentQuantity.lt(requested)) {
      throw new AppError(
        `Insufficient stock for material "${material.name}". Requested ${requested.toFixed(2)} but available ${currentQuantity.toFixed(2)} ${material.unit}.`,
        400,
        true,
        "INSUFFICIENT_STOCK",
      );
    }

    const nextQuantity = currentQuantity.minus(requested);

    await tx.material.update({
      where: { id: materialId },
      data: {
        currentQuantity: { decrement: requested.toNumber() },
      },
    });

    await tx.stockMovement.create({
      data: {
        businessId,
        materialId,
        orderId: metadata?.orderId ?? null,
        type: MovementType.USAGE,
        quantityChange: new Prisma.Decimal(requested.neg().toFixed(2)),
        quantityBefore: new Prisma.Decimal(currentQuantity.toFixed(2)),
        quantityAfter: new Prisma.Decimal(nextQuantity.toFixed(2)),
        notes: metadata?.notes ?? `Stock deduction for order ${metadata?.orderId ?? "inventory"}`,
        createdById: metadata?.userId ?? null,
      },
    });

    return tx.material.findUnique({
      where: { id: materialId },
      include: { stockMovements: { orderBy: { createdAt: "desc" } } },
    });
  });
}

export async function restockItems(
  businessId: string,
  materialId: string,
  quantity: number,
  metadata?: {
    orderId?: string;
    userId?: string;
    notes?: string;
  },
) {
  const amount = toDecimal(quantity).toDecimalPlaces(2);

  if (!amount.isFinite() || amount.lte(0)) {
    throw new AppError("Restock quantity must be greater than zero.", 400, true, "VALIDATION_ERROR");
  }

  return prisma.$transaction(async (tx) => {
    const material = await tx.material.findFirst({
      where: {
        id: materialId,
        businessId,
        deletedAt: null,
      },
    });

    if (!material) {
      throw new AppError("Material not found.", 404, true, "NOT_FOUND");
    }

    const currentQuantity = toDecimal(material.currentQuantity);
    const nextQuantity = currentQuantity.plus(amount);

    await tx.material.update({
      where: { id: materialId },
      data: {
        currentQuantity: { increment: amount.toNumber() },
      },
    });

    await tx.stockMovement.create({
      data: {
        businessId,
        materialId,
        orderId: metadata?.orderId ?? null,
        type: MovementType.RETURN,
        quantityChange: new Prisma.Decimal(amount.toFixed(2)),
        quantityBefore: new Prisma.Decimal(currentQuantity.toFixed(2)),
        quantityAfter: new Prisma.Decimal(nextQuantity.toFixed(2)),
        notes: metadata?.notes ?? "Inventory restock / reversal",
        createdById: metadata?.userId ?? null,
      },
    });

    return tx.material.findUnique({
      where: { id: materialId },
      include: { stockMovements: { orderBy: { createdAt: "desc" } } },
    });
  });
}

export async function adjustStock(
  businessId: string,
  materialId: string,
  input: AdjustStockInput,
  userId?: string,
) {
  const quantityChange = toDecimal(input.quantityChange).toDecimalPlaces(2);

  if (!quantityChange.isFinite() || quantityChange.eq(0)) {
    throw new AppError("Quantity change cannot be zero.", 400, true, "VALIDATION_ERROR");
  }

  const result = await prisma.$transaction(async (tx) => {
    const material = await tx.material.findFirst({
      where: {
        id: materialId,
        businessId,
        deletedAt: null,
      },
    });

    if (!material) {
      throw new AppError("Material not found.", 404, true, "NOT_FOUND");
    }

    const currentQty = toDecimal(material.currentQuantity);
    const nextQty = currentQty.plus(quantityChange);

    if (nextQty.lt(0)) {
      throw new AppError(
        `Stock adjustment would result in negative stock. Current stock is ${currentQty.toFixed(2)} ${material.unit}, attempted change is ${quantityChange.toFixed(2)}.`,
        400,
        true,
        "VALIDATION_ERROR",
      );
    }

    await tx.material.update({
      where: { id: materialId },
      data: {
        currentQuantity: { increment: quantityChange.toNumber() },
      },
    });

    await tx.stockMovement.create({
      data: {
        businessId,
        materialId,
        type: input.type,
        quantityChange: new Prisma.Decimal(quantityChange.toFixed(2)),
        quantityBefore: new Prisma.Decimal(currentQty.toFixed(2)),
        quantityAfter: new Prisma.Decimal(nextQty.toFixed(2)),
        notes: input.notes?.trim() || null,
        createdById: userId ?? null,
      },
    });

    const refreshed = await tx.material.findUnique({
      where: { id: materialId },
      include: {
        stockMovements: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return refreshed!;
  });

  return formatMaterialSummary(result);
}

export async function deleteMaterial(businessId: string, materialId: string) {
  const existing = await prisma.material.findFirst({
    where: {
      id: materialId,
      businessId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError("Material not found.", 404, true, "NOT_FOUND");
  }

  return prisma.material.update({
    where: { id: materialId },
    data: { isActive: false, deletedAt: new Date() },
  });
}

export async function getInventorySummary(businessId: string) {
  const materials = await prisma.material.findMany({
    where: {
      businessId,
      deletedAt: null,
    },
  });

  const totalMaterials = materials.length;
  let activeMaterials = 0;
  let lowStockMaterials = 0;
  let outOfStockMaterials = 0;
  let rawValue = 0;

  const categoryCounts: Record<string, number> = {
    FABRIC: 0,
    THREAD: 0,
    BUTTON: 0,
    ZIPPER: 0,
    LINING: 0,
    INTERFACING: 0,
    ELASTIC: 0,
    OTHER: 0,
  };

  materials.forEach((material) => {
    categoryCounts[material.category] = (categoryCounts[material.category] || 0) + 1;

    if (material.isActive) {
      activeMaterials += 1;

      const quantity = toMoney(material.currentQuantity);
      const minimumStockLevel = toMoney(material.minimumStockLevel);
      const costPerUnit = toMoney(material.costPerUnit);

      rawValue += quantity * costPerUnit;

      if (quantity <= 0) {
        outOfStockMaterials += 1;
      } else if (quantity <= minimumStockLevel) {
        lowStockMaterials += 1;
      }
    }
  });

  return {
    totalMaterials,
    activeMaterials,
    lowStockMaterials,
    outOfStockMaterials,
    totalInventoryValue: Number(new Decimal(rawValue).toFixed(2)),
    categoryCounts,
  };
}
