import { z } from "zod";

export const createCustomerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(100, "First name is too long"),

  lastName: z
    .string()
    .trim()
    .max(100, "Last name is too long")
    .optional(),

  phone: z
    .string()
    .trim()
    .min(7, "Phone number is too short")
    .max(30, "Phone number is too long"),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .max(254)
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .trim()
    .max(500, "Address is too long")
    .optional(),

  notes: z
    .string()
    .trim()
    .max(2000, "Notes are too long")
    .optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerIdSchema = z.object({
  id: z.string().uuid("Invalid customer ID"),
});

export const customerListQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100)
    .optional(),

  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),
});

export type CreateCustomerInput =
  z.infer<typeof createCustomerSchema>;

export type UpdateCustomerInput =
  z.infer<typeof updateCustomerSchema>;

export type CustomerListQuery =
  z.infer<typeof customerListQuerySchema>;