import { z } from "zod";

export const materialCategoryEnum = z.enum([
  "FABRIC",
  "THREAD",
  "BUTTON",
  "ZIPPER",
  "LINING",
  "INTERFACING",
  "ELASTIC",
  "OTHER",
]);

export const materialUnitEnum = z.enum([
  "YARD",
  "METER",
  "PIECE",
  "ROLL",
  "SPOOL",
  "PACK",
  "OTHER",
]);

export const movementTypeEnum = z.enum([
  "INITIAL_STOCK",
  "PURCHASE",
  "ADJUSTMENT",
  "USAGE",
  "RETURN",
  "WASTE",
]);

export const createMaterialSchema = z.object({
  name: z
    .string({ required_error: "Material name is required." })
    .trim()
    .min(1, "Material name cannot be empty.")
    .max(150, "Material name cannot exceed 150 characters."),
  sku: z
    .string()
    .trim()
    .max(50, "SKU cannot exceed 50 characters.")
    .nullable()
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters.")
    .nullable()
    .optional(),
  category: materialCategoryEnum.default("FABRIC"),
  unit: materialUnitEnum.default("YARD"),
  initialQuantity: z
    .number({ invalid_type_error: "Initial quantity must be a number." })
    .min(0, "Initial quantity cannot be negative.")
    .default(0),
  minimumStockLevel: z
    .number({ invalid_type_error: "Minimum stock level must be a number." })
    .min(0, "Minimum stock level cannot be negative.")
    .default(0),
  costPerUnit: z
    .number({ invalid_type_error: "Cost per unit must be a number." })
    .min(0, "Cost per unit cannot be negative.")
    .default(0),
});

export const updateMaterialSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Material name cannot be empty.")
    .max(150, "Material name cannot exceed 150 characters.")
    .optional(),
  sku: z
    .string()
    .trim()
    .max(50, "SKU cannot exceed 50 characters.")
    .nullable()
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters.")
    .nullable()
    .optional(),
  category: materialCategoryEnum.optional(),
  unit: materialUnitEnum.optional(),
  minimumStockLevel: z
    .number()
    .min(0, "Minimum stock level cannot be negative.")
    .optional(),
  costPerUnit: z
    .number()
    .min(0, "Cost per unit cannot be negative.")
    .optional(),
  isActive: z.boolean().optional(),
});

export const adjustStockSchema = z.object({
  type: movementTypeEnum,
  quantityChange: z
    .number({ required_error: "Quantity change is required." })
    .refine((val) => val !== 0, {
      message: "Quantity change cannot be zero.",
    }),
  notes: z
    .string()
    .trim()
    .max(500, "Notes cannot exceed 500 characters.")
    .nullable()
    .optional(),
});

export const materialParamsSchema = z.object({
  id: z.string().uuid("Invalid material ID format."),
});

export const materialQuerySchema = z.object({
  category: materialCategoryEnum.optional(),
  search: z.string().optional(),
  status: z.enum(["ALL", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
});

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type MaterialQueryInput = z.infer<typeof materialQuerySchema>;
