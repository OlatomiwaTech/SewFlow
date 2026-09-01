import { z } from "zod";

const measurementValueSchema = z
  .number({ invalid_type_error: "Measurement value must be a number." })
  .positive("Measurement value must be greater than zero.")
  .max(500, "Measurement value exceeds reasonable limit (500).")
  .nullable()
  .optional();

export const createMeasurementSchema = z.object({
  unit: z.enum(["CM", "INCH"]).default("CM"),
  neck: measurementValueSchema,
  shoulder: measurementValueSchema,
  chest: measurementValueSchema,
  waist: measurementValueSchema,
  hip: measurementValueSchema,
  sleeve: measurementValueSchema,
  shirtLength: measurementValueSchema,
  trouserLength: measurementValueSchema,
  thigh: measurementValueSchema,
  knee: measurementValueSchema,
  ankle: measurementValueSchema,
  notes: z.string().max(2000, "Notes cannot exceed 2000 characters.").nullable().optional(),
});

export const updateMeasurementSchema = createMeasurementSchema.partial();

export const customerParamsSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID format."),
});

export const measurementParamsSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID format."),
  measurementId: z.string().uuid("Invalid measurement ID format."),
});

export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>;
export type UpdateMeasurementInput = z.infer<typeof updateMeasurementSchema>;
