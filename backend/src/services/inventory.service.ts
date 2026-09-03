import { MovementType, Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import type {
  AdjustStockInput,
  CreateMaterialInput,
  MaterialQueryInput,
  UpdateMaterialInput,
} from "../validators/inventory.validator.js";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

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
  const quantity = Number(material.currentQuantity);
  const minStock = Number(material.minimumStockLevel);
  const cost = Number(material.costPerUnit);

  const stockStatus = getStockStatus(quantity, minStock);
  const estimatedValue = Math.max(0, quantity * cost);

  return {
    ...material,
    currentQuantity: quantity,
    minimumStockLevel: minStock,
    costPerUnit: cost,
    stockStatus,
    estimatedValue,
    stockMovements: material.stockMovements
      ? material.stockMovements.map((m) => ({
          ...m,
          quantityChange: Number(m.quantityChange),
          quantityBefore: Number(m.quantityBefore),
          quantityAfter: Number(m.quantityAfter),
        }))
      : [],
  };
}

export async function listMaterials(businessId: string, query?: MaterialQueryInput) {
  const whereClause: Prisma.MaterialWhereInput = {
    businessId,
  };

  if (query?.isActive !== undefined) {
    whereClause.isActive = query.isActive;
  }

  if (query?.category) {
    whereClause.category = query.category;
  }

  if (query?.search) {
    const s = query.search.trim();
    whereClause.OR = [
      { name: { contains: s, mode: "insensitive" } },
      { sku: { contains: s, mode: "insensitive" } },
      { description: { contains: s, mode: "insensitive" } },
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
    return formatted.filter((m) => m.stockStatus === query.status);
  }

  return formatted;
}

export async function getMaterial(businessId: string, materialId: string) {
  const material = await prisma.material.findFirst({
    where: {
      id: materialId,
      businessId,
    },
    include: {
      stockMovements: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!material) {
    const error = new Error("Material not found.");
    error.name = "NOT_FOUND";
    throw error;
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
      },
      select: { id: true },
    });

    if (existingSku) {
      const error = new Error(`Material SKU '${input.sku}' is already in use.`);
      error.name = "VALIDATION_ERROR";
      throw error;
    }
  }

  const initialQty = input.initialQuantity ?? 0;

  const result = await prisma.$transaction(async (tx) => {
    const material = await tx.material.create({
      data: {
        businessId,
        name: input.name.trim(),
        sku: input.sku?.trim() || null,
        description: input.description?.trim() || null,
        category: input.category,
        unit: input.unit,
        currentQuantity: new Prisma.Decimal(initialQty),
        minimumStockLevel: new Prisma.Decimal(input.minimumStockLevel ?? 0),
        costPerUnit: new Prisma.Decimal(input.costPerUnit ?? 0),
        ...(initialQty > 0 && {
          stockMovements: {
            create: {
              type: MovementType.INITIAL_STOCK,
              quantityChange: new Prisma.Decimal(initialQty),
              quantityBefore: new Prisma.Decimal(0),
              quantityAfter: new Prisma.Decimal(initialQty),
              notes: "Initial stock created",
              createdById: userId || null,
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
    },
  });

  if (!existing) {
    const error = new Error("Material not found.");
    error.name = "NOT_FOUND";
    throw error;
  }

  if (input.sku && input.sku.trim() !== existing.sku) {
    const duplicateSku = await prisma.material.findFirst({
      where: {
        businessId,
        sku: input.sku.trim(),
        id: { not: materialId },
      },
      select: { id: true },
    });

    if (duplicateSku) {
      const error = new Error(`Material SKU '${input.sku}' is already in use.`);
      error.name = "VALIDATION_ERROR";
      throw error;
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
        minimumStockLevel: new Prisma.Decimal(input.minimumStockLevel),
      }),
      ...(input.costPerUnit !== undefined && {
        costPerUnit: new Prisma.Decimal(input.costPerUnit),
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

export async function adjustStock(
  businessId: string,
  materialId: string,
  input: AdjustStockInput,
  userId?: string,
) {
  const result = await prisma.$transaction(async (tx) => {
    const material = await tx.material.findFirst({
      where: {
        id: materialId,
        businessId,
      },
    });

    if (!material) {
      const error = new Error("Material not found.");
      error.name = "NOT_FOUND";
      throw error;
    }

    const currentQty = Number(material.currentQuantity);
    const change = input.quantityChange;
    const newQty = currentQty + change;

    if (newQty < 0) {
      const error = new Error(
        `Stock adjustment would result in negative stock. Current stock is ${currentQty} ${material.unit}, attempted change is ${change}.`,
      );
      error.name = "VALIDATION_ERROR";
      throw error;
    }

    const updatedMaterial = await tx.material.update({
      where: { id: materialId },
      data: {
        currentQuantity: new Prisma.Decimal(newQty),
      },
    });

    await tx.stockMovement.create({
      data: {
        materialId,
        type: input.type,
        quantityChange: new Prisma.Decimal(change),
        quantityBefore: new Prisma.Decimal(currentQty),
        quantityAfter: new Prisma.Decimal(newQty),
        notes: input.notes?.trim() || null,
        createdById: userId || null,
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
    },
    select: { id: true },
  });

  if (!existing) {
    const error = new Error("Material not found.");
    error.name = "NOT_FOUND";
    throw error;
  }

  // Soft deactivation to preserve stock history audit trail
  return prisma.material.update({
    where: { id: materialId },
    data: { isActive: false },
  });
}

export async function getInventorySummary(businessId: string) {
  const materials = await prisma.material.findMany({
    where: {
      businessId,
    },
  });

  const totalMaterials = materials.length;
  let activeMaterials = 0;
  let lowStockMaterials = 0;
  let outOfStockMaterials = 0;
  let totalInventoryValue = 0;

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

  materials.forEach((m) => {
    categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;

    if (m.isActive) {
      activeMaterials += 1;

      const qty = Number(m.currentQuantity);
      const minStock = Number(m.minimumStockLevel);
      const cost = Number(m.costPerUnit);

      totalInventoryValue += qty * cost;

      if (qty <= 0) {
        outOfStockMaterials += 1;
      } else if (qty <= minStock) {
        lowStockMaterials += 1;
      }
    }
  });

  return {
    totalMaterials,
    activeMaterials,
    lowStockMaterials,
    outOfStockMaterials,
    totalInventoryValue,
    categoryCounts,
  };
}
