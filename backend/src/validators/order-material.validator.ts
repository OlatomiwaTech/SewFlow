import { z } from "zod";

export const orderMaterialNestedParamsSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  orderId: z.string().uuid("Invalid order ID"),
});

export const orderMaterialItemParamsSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  orderId: z.string().uuid("Invalid order ID"),
  orderMaterialId: z.string().uuid("Invalid order material ID"),
});

export const addPlannedMaterialSchema = z.object({
  materialId: z.string().uuid("Invalid material ID"),
  plannedQuantity: z
    .number({ required_error: "Planned quantity is required" })
    .positive("Planned quantity must be greater than zero"),
  notes: z.string().max(500, "Notes too long").optional(),
});

export const updateOrderMaterialSchema = z.object({
  plannedQuantity: z
    .number()
    .positive("Planned quantity must be greater than zero")
    .optional(),
  notes: z.string().max(500, "Notes too long").optional(),
});

export const recordActualConsumptionSchema = z.object({
  actualQuantity: z
    .number({ required_error: "Actual quantity is required" })
    .min(0, "Actual quantity cannot be negative"),
  notes: z.string().max(500, "Notes too long").optional(),
});

export type AddPlannedMaterialInput = z.infer<typeof addPlannedMaterialSchema>;
export type UpdateOrderMaterialInput = z.infer<typeof updateOrderMaterialSchema>;
export type RecordActualConsumptionInput = z.infer<typeof recordActualConsumptionSchema>;
