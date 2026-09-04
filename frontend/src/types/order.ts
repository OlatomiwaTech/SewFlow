import type { Customer } from "./customer";
import type { Payment, PaymentStatus } from "./payment";
import type { Material } from "./inventory";

export type OrderStatus =
  | "NEW"
  | "MEASURED"
  | "CUTTING"
  | "SEWING"
  | "FITTING"
  | "READY"
  | "DELIVERED"
  | "CANCELLED"
  | "PENDING"
  | "IN_PROGRESS";

export type OrderPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface OrderHistory {
  id: string;
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface OrderMaterial {
  id: string;
  orderId: string;
  materialId: string;
  plannedQuantity: number;
  actualQuantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  material?: Material;
}

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
  priority: OrderPriority;
  orderDate: string;
  expectedDate: string | null;
  deliveredAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  payments?: Payment[];
  history?: OrderHistory[];
  materials?: OrderMaterial[];
}

export interface CreateOrderInput {
  garmentType: string;
  description?: string | null;
  quantity?: number;
  totalAmount: number;
  depositAmount?: number;
  priority?: OrderPriority;
  status?: OrderStatus;
  expectedDate?: string | null;
  notes?: string | null;
}

export interface UpdateOrderInput {
  garmentType?: string;
  description?: string | null;
  quantity?: number;
  totalAmount?: number;
  depositAmount?: number;
  priority?: OrderPriority;
  status?: OrderStatus;
  expectedDate?: string | null;
  notes?: string | null;
}

export interface AddPlannedMaterialInput {
  materialId: string;
  plannedQuantity: number;
  notes?: string;
}

export interface UpdateOrderMaterialInput {
  plannedQuantity?: number;
  notes?: string;
}

export interface RecordActualConsumptionInput {
  actualQuantity: number;
  notes?: string;
}

export interface OrderListResponse {
  success: boolean;
  data: Order[];
}

export interface ProductionMetrics {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  urgentOrders: number;
  totalRevenue: number;
  totalCollected: number;
  balanceOutstanding: number;
  statusCounts: Record<OrderStatus, number>;
}
