"use client";

import type { Order } from "@/types/order";
import { OrderStatusBadge } from "./order-status-badge";
import { Calendar, DollarSign, Shirt, FileText, Edit, Trash2 } from "lucide-react";

interface OrderDetailProps {
  order: Order;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function OrderDetail({
  order,
  onEdit,
  onDelete,
}: Readonly<OrderDetailProps>) {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const total = Number(order.totalAmount);
  const deposit = Number(order.depositAmount);
  const balance = Math.max(0, total - deposit);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold">{order.garmentType}</h3>
            <OrderStatusBadge status={order.status} />
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

      {/* Pricing Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4 bg-card/50 space-y-1">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-primary" />
            Total Price
          </span>
          <p className="text-xl font-mono font-bold">
            ₦{total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="rounded-lg border p-4 bg-card/50 space-y-1">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
            Deposit Paid
          </span>
          <p className="text-xl font-mono font-bold text-emerald-600">
            ₦{deposit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="rounded-lg border p-4 bg-card/50 space-y-1">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-amber-600" />
            Outstanding Balance
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
