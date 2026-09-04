"use client";

import { useState, useCallback, useEffect } from "react";
import type { Order } from "@/types/order";
import type { CreatePaymentInput, Payment, UpdatePaymentInput } from "@/types/payment";
import { OrderStatusBadge } from "./order-status-badge";
import { PaymentStatusBadge } from "../payments/payment-status-badge";
import { PaymentList } from "../payments/payment-list";
import { PaymentForm } from "../payments/payment-form";
import { OrderMaterialsSection } from "./order-materials-section";
import { apiClient } from "@/lib/api";
import { Calendar, DollarSign, Shirt, FileText, Edit, Trash2, Plus, CreditCard } from "lucide-react";

interface OrderDetailProps {
  order: Order;
  onEdit?: () => void;
  onDelete?: () => void;
  onOrderUpdated?: () => void;
}

export function OrderDetail({
  order,
  onEdit,
  onDelete,
  onOrderUpdated,
}: Readonly<OrderDetailProps>) {
  const [payments, setPayments] = useState<Payment[]>(order.payments || []);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"list" | "create" | "edit">("list");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const total = Number(order.totalAmount);
  const paid = order.totalPaid !== undefined ? Number(order.totalPaid) : Number(order.depositAmount);
  const balance = order.balanceDue !== undefined ? Number(order.balanceDue) : Math.max(0, total - paid);
  const pStatus = order.paymentStatus || (paid >= total ? "PAID" : paid > 0 ? "PARTIALLY_PAID" : "UNPAID");

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoadingPayments(true);
      const data = await apiClient.listPayments(order.customerId, order.id);
      setPayments(data);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setIsLoadingPayments(false);
    }
  }, [order.customerId, order.id]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleCreatePayment = async (data: CreatePaymentInput | UpdatePaymentInput) => {
    try {
      setIsSavingPayment(true);
      await apiClient.createPayment(order.customerId, order.id, data as CreatePaymentInput);
      await fetchPayments();
      if (onOrderUpdated) onOrderUpdated();
      setPaymentMode("list");
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleUpdatePayment = async (data: CreatePaymentInput | UpdatePaymentInput) => {
    if (!selectedPayment) return;
    try {
      setIsSavingPayment(true);
      await apiClient.updatePayment(order.customerId, order.id, selectedPayment.id, data as UpdatePaymentInput);
      await fetchPayments();
      if (onOrderUpdated) onOrderUpdated();
      setSelectedPayment(null);
      setPaymentMode("list");
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    await apiClient.deletePayment(order.customerId, order.id, paymentId);
    await fetchPayments();
    if (onOrderUpdated) onOrderUpdated();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold">{order.garmentType}</h3>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={pStatus} />
          </div>
          <p className="text-xs text-muted-foreground">
            Quantity: <strong className="text-foreground font-mono">{order.quantity}</strong> | Order Date:{" "}
            <span className="font-medium">{formatDate(order.orderDate)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium hover:bg-accent transition-colors"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit Order
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-destructive/20 text-destructive rounded-lg text-xs font-medium hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Order
            </button>
          )}
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4 bg-card/50 space-y-1">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-primary" />
            Order Total
          </span>
          <p className="text-xl font-mono font-bold">
            ₦{total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="rounded-lg border p-4 bg-card/50 space-y-1">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
            Total Paid
          </span>
          <p className="text-xl font-mono font-bold text-emerald-600">
            ₦{paid.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="rounded-lg border p-4 bg-card/50 space-y-1">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-amber-600" />
            Balance Due
          </span>
          <p className={`text-xl font-mono font-bold ${balance > 0 ? "text-amber-600" : "text-emerald-600"}`}>
            ₦{balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Description & Schedule */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4 bg-card/50 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Shirt className="h-3.5 w-3.5 text-primary" />
            <span>Description / Design Details</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {order.description || "No specific design details provided."}
          </p>
        </div>

        <div className="rounded-lg border p-4 bg-card/50 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>Schedule</span>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expected Delivery:</span>
              <span className="font-semibold">{formatDate(order.expectedDate)}</span>
            </div>
            {order.deliveredAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivered On:</span>
                <span className="font-semibold text-emerald-600">{formatDate(order.deliveredAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Materials & Inventory Section */}
      <OrderMaterialsSection customerId={order.customerId} orderId={order.id} />

      {/* Payment History Section */}
      <div className="rounded-xl border p-5 bg-card/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Payment History
            </h4>
          </div>

          {paymentMode === "list" && balance > 0 && (
            <button
              type="button"
              onClick={() => setPaymentMode("create")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Record Payment
            </button>
          )}
        </div>

        {paymentMode === "create" && (
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase text-muted-foreground">Record New Payment</h5>
            <PaymentForm
              maxAmountAllowed={balance}
              onSubmit={handleCreatePayment}
              onCancel={() => setPaymentMode("list")}
              isLoading={isSavingPayment}
              submitLabel="Confirm Payment"
            />
          </div>
        )}

        {paymentMode === "edit" && selectedPayment && (
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase text-muted-foreground">Edit Payment Record</h5>
            <PaymentForm
              initialData={selectedPayment}
              maxAmountAllowed={balance + Number(selectedPayment.amount)}
              onSubmit={handleUpdatePayment}
              onCancel={() => {
                setSelectedPayment(null);
                setPaymentMode("list");
              }}
              isLoading={isSavingPayment}
              submitLabel="Update Payment"
            />
          </div>
        )}

        {paymentMode === "list" && (
          <PaymentList
            payments={payments}
            isLoading={isLoadingPayments}
            onEdit={(p) => {
              setSelectedPayment(p);
              setPaymentMode("edit");
            }}
            onDelete={handleDeletePayment}
          />
        )}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="rounded-lg border p-4 bg-card/50 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>Notes</span>
          </div>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
