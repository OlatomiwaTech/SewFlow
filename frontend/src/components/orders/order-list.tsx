"use client";

import { useState } from "react";
import type { Order } from "@/types/order";
import { OrderDetail } from "./order-detail";
import { OrderStatusBadge } from "./order-status-badge";
import { Plus, Shirt, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface OrderListProps {
  orders: Order[];
  isLoading?: boolean;
  onAdd: () => void;
  onEdit: (order: Order) => void;
  onDelete: (orderId: string) => Promise<void>;
}

export function OrderList({
  orders,
  isLoading = false,
  onAdd,
  onEdit,
  onDelete,
}: Readonly<OrderListProps>) {
  const [expandedId, setExpandedId] = useState<string | null>(
    orders.length > 0 ? orders[0].id : null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this order?")) {
      return;
    }
    try {
      setDeletingId(id);
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border p-12 text-center bg-card">
        <Shirt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-semibold">No orders recorded yet</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
          Create the first tailoring job or garment order for this customer.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create First Order
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Order History</h2>
          <p className="text-xs text-muted-foreground">
            {orders.length} {orders.length === 1 ? "order" : "orders"} on record
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Order
        </button>
      </div>

      <div className="space-y-4">
        {orders.map((o) => {
          const isExpanded = expandedId === o.id;
          const total = Number(o.totalAmount);
          const deposit = Number(o.depositAmount);
          const balance = Math.max(0, total - deposit);

          return (
            <div
              key={o.id}
              className="rounded-xl border bg-card transition-all"
            >
              {/* Header Bar */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : o.id)}
              >
                <div className="flex items-center gap-3">
                  <Shirt className="h-5 w-5 text-primary" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{o.garmentType}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Qty: {o.quantity} | Total: ₦{total.toLocaleString()} | Balance:{" "}
                      <span className={balance > 0 ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold"}>
                        ₦{balance.toLocaleString()}
                      </span>{" "}
                      | Due: {formatDate(o.expectedDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {deletingId === o.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Accordion Detail */}
              {isExpanded && (
                <div className="p-4 pt-0 border-t">
                  <div className="pt-4">
                    <OrderDetail
                      order={o}
                      onEdit={() => onEdit(o)}
                      onDelete={() => handleDelete(o.id)}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
