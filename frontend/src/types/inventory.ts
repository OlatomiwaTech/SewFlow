export type MaterialCategory =
  | "FABRIC"
  | "THREAD"
  | "BUTTON"
  | "ZIPPER"
  | "LINING"
  | "INTERFACING"
  | "ELASTIC"
  | "OTHER";

export type MaterialUnit =
  | "YARD"
  | "METER"
  | "PIECE"
  | "ROLL"
  | "SPOOL"
  | "PACK"
  | "OTHER";

export type MovementType =
  | "INITIAL_STOCK"
  | "PURCHASE"
  | "ADJUSTMENT"
  | "USAGE"
  | "RETURN"
  | "WASTE";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface StockMovement {
  id: string;
  materialId: string;
  type: MovementType;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  notes?: string | null;
  createdById?: string | null;
  createdAt: string;
}

export interface Material {
  id: string;
  businessId: string;
  sku?: string | null;
  name: string;
  description?: string | null;
  category: MaterialCategory;
  unit: MaterialUnit;
  currentQuantity: number;
  minimumStockLevel: number;
  costPerUnit: number;
  stockStatus: StockStatus;
  estimatedValue: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stockMovements?: StockMovement[];
}

export interface CreateMaterialInput {
  name: string;
  sku?: string | null;
  description?: string | null;
  category?: MaterialCategory;
  unit?: MaterialUnit;
  initialQuantity?: number;
  minimumStockLevel?: number;
  costPerUnit?: number;
}

export interface UpdateMaterialInput {
  name?: string;
  sku?: string | null;
  description?: string | null;
  category?: MaterialCategory;
  unit?: MaterialUnit;
  minimumStockLevel?: number;
  costPerUnit?: number;
  isActive?: boolean;
}

export interface AdjustStockInput {
  type: MovementType;
  quantityChange: number;
  notes?: string | null;
}

export interface InventorySummary {
  totalMaterials: number;
  activeMaterials: number;
  lowStockMaterials: number;
  outOfStockMaterials: number;
  totalInventoryValue: number;
  categoryCounts: Record<MaterialCategory, number>;
}
