import { z } from "zod";

export const orderStatusEnum = z.enum([
  "NEW",
  "MEASURED",
  "CUTTING",
  "SEWING",
  "FITTING",
  "READY",
  "DELIVERED",
  "CANCELLED",
  "PENDING",
  "IN_PROGRESS",
]);

export const orderPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const createOrderSchema = z
  .object({
    garmentType: z
      .string({ required_error: "Garment type is required." })
      .trim()
      .min(1, "Garment type cannot be empty.")
      .max(100, "Garment type cannot exceed 100 characters."),
    description: z
      .string()
      .trim()
      .max(1000, "Description cannot exceed 1000 characters.")
      .nullable()
      .optional(),
    quantity: z
      .number({ invalid_type_error: "Quantity must be a number." })
      .int("Quantity must be a whole integer.")
      .min(1, "Quantity must be at least 1.")
      .default(1),
    totalAmount: z
      .number({ required_error: "Total amount is required." })
      .min(0, "Total amount cannot be negative."),
    depositAmount: z
      .number()
      .min(0, "Deposit amount cannot be negative.")
      .default(0),
    priority: orderPriorityEnum.default("MEDIUM"),
    status: orderStatusEnum.default("NEW"),
    expectedDate: z
      .string()
      .datetime({ message: "Expected delivery date must be a valid ISO date." })
      .nullable()
      .optional(),
    notes: z
      .string()
      .trim()
      .max(2000, "Notes cannot exceed 2000 characters.")
      .nullable()
      .optional(),
  })
  .refine((data) => data.depositAmount <= data.totalAmount, {
    message: "Deposit amount cannot exceed the total amount.",
    path: ["depositAmount"],
  });

export const updateOrderSchema = z
  .object({
    garmentType: z
      .string()
      .trim()
      .min(1, "Garment type cannot be empty.")
      .max(100, "Garment type cannot exceed 100 characters.")
      .optional(),
    description: z
      .string()
      .trim()
      .max(1000, "Description cannot exceed 1000 characters.")
      .nullable()
      .optional(),
    quantity: z
      .number()
      .int("Quantity must be a whole integer.")
      .min(1, "Quantity must be at least 1.")
      .optional(),
    totalAmount: z
      .number()
      .min(0, "Total amount cannot be negative.")
      .optional(),
    depositAmount: z
      .number()
      .min(0, "Deposit amount cannot be negative.")
      .optional(),
    priority: orderPriorityEnum.optional(),
    status: orderStatusEnum.optional(),
    expectedDate: z
      .string()
      .datetime({ message: "Expected delivery date must be a valid ISO date." })
      .nullable()
      .optional(),
    notes: z
      .string()
      .trim()
      .max(2000, "Notes cannot exceed 2000 characters.")
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      if (
        data.depositAmount !== undefined &&
        data.totalAmount !== undefined
      ) {
        return data.depositAmount <= data.totalAmount;
      }
      return true;
    },
    {
      message: "Deposit amount cannot exceed the total amount.",
      path: ["depositAmount"],
    },
  );

export const orderQuerySchema = z.object({
  status: orderStatusEnum.optional(),
  priority: orderPriorityEnum.optional(),
  customerId: z.string().uuid("Invalid customer ID.").optional(),
  search: z.string().optional(),
});

export const orderParamsSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID format."),
  orderId: z.string().uuid("Invalid order ID format."),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
