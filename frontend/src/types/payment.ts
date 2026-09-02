export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "CARD"
  | "POS"
  | "OTHER";

export type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID";

export interface Payment {
  id: string;
  orderId: string;
  amount: number | string;
  method: PaymentMethod;
  reference: string | null;
  paymentDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSummary {
  totalAmount: number;
  totalPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
}

export interface CreatePaymentInput {
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  paymentDate?: string | null;
  notes?: string | null;
}

export type UpdatePaymentInput = Partial<CreatePaymentInput>;
