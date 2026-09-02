import type { Payment, PaymentStatus } from "./payment";

export type OrderStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";

export interface Order {
  id: string;
  customerId: string;
  garmentType: string;
  description: string | null;
  quantity: number;
  totalAmount: number | string;
  depositAmount: number | string;
  totalPaid?: number | string;
  balanceDue?: number | string;
  paymentStatus?: PaymentStatus;
  status: OrderStatus;
  orderDate: string;
  expectedDate: string | null;
  deliveredAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  payments?: Payment[];
}

export interface CreateOrderInput {
  garmentType: string;
  description?: string | null;
  quantity?: number;
  totalAmount: number;
  depositAmount?: number;
  expectedDate?: string | null;
  notes?: string | null;
}

export interface UpdateOrderInput {
  garmentType?: string;
  description?: string | null;
  quantity?: number;
  totalAmount?: number;
  depositAmount?: number;
  status?: OrderStatus;
  expectedDate?: string | null;
  notes?: string | null;
}

export interface OrderListResponse {
  success: boolean;
  data: Order[];
}
