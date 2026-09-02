import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z
    .number({ required_error: "Payment amount is required." })
    .positive("Payment amount must be greater than 0."),
  method: z.enum(["CASH", "BANK_TRANSFER", "CARD", "POS", "OTHER"], {
    required_error: "Payment method is required.",
  }),
  reference: z
    .string()
    .trim()
    .max(100, "Reference cannot exceed 100 characters.")
    .nullable()
    .optional(),
  paymentDate: z
    .string()
    .datetime({ message: "Payment date must be a valid ISO date." })
    .nullable()
    .optional(),
  notes: z
    .string()
    .trim()
    .max(2000, "Notes cannot exceed 2000 characters.")
    .nullable()
    .optional(),
});

export const updatePaymentSchema = createPaymentSchema.partial();

export const orderNestedParamsSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID format."),
  orderId: z.string().uuid("Invalid order ID format."),
});

export const paymentParamsSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID format."),
  orderId: z.string().uuid("Invalid order ID format."),
  paymentId: z.string().uuid("Invalid payment ID format."),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
