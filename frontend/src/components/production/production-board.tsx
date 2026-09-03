"use client";

import { useState } from "react";
import type { Order, OrderStatus } from "@/types/order";
import { OrderPriorityBadge } from "../orders/order-priority-badge";
import { PaymentStatusBadge } from "../payments/payment-status-badge";
import { Loader2, ArrowRight, ArrowLeft, User, Calendar, CheckCircle2 } from "lucide-react";

interface ProductionBoardProps {
  orders: Order[];
  onStatusChange: (customerId: string, orderId: string, newStatus: OrderStatus) => Promise<void>;
  onSelectOrder?: (order: Order) => void;
}

const STAGES: { id: OrderStatus; name: string; color: string }[] = [
  { id: "NEW", name: "New Orders", color: "border-purple-500 bg-purple-50/50" },
  { id: "MEASURED", name: "Measured", color: "border-indigo-500 bg-indigo-50/50" },
  { id: "CUTTING", name: "Cutting", color: "border-sky-500 bg-sky-50/50" },
  { id: "SEWING", name: "Sewing", color: "border-blue-500 bg-blue-50/50" },
  { id: "FITTING", name: "Fitting", color: "border-amber-500 bg-amber-50/50" },
  { id: "READY", name: "Ready", color: "border-emerald-500 bg-emerald-50/50" },
  { id: "DELIVERED", name: "Delivered", color: "border-slate-400 bg-slate-50/50" },
];

const STAGE_ORDER: OrderStatus[] = [
  "NEW",
  "MEASURED",
  "CUTTING",
  "SEWING",
  "FITTING",
  "READY",
  "DELIVERED",
];

export function ProductionBoard({
  orders,
  onStatusChange,
  onSelectOrder,
}: Readonly<ProductionBoardProps>) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleAdvance = async (order: Order, direction: "next" | "prev") => {
    const currentIndex = STAGE_ORDER.indexOf(order.status);
    if (currentIndex === -1) return;

    const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= STAGE_ORDER.length) return;

    const nextStatus = STAGE_ORDER[nextIndex];
    setUpdatingId(order.id);
    try {
      await onStatusChange(order.customerId, order.id, nextStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="overflow-x-auto pb-6">
      <div className="inline-flex gap-4 min-w-full items-start">
        {STAGES.map((stage) => {
          const stageOrders = orders.filter((o) => o.status === stage.id);

          return (
            <div
              key={stage.id}
              className={`w-72 shrink-0 rounded-xl border ${stage.color} p-3 flex flex-col max-h-[80vh] overflow-hidden shadow-xs`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <span>{stage.name}</span>
                </h4>
                <span className="text-xs font-bold px-2 py-0.5 bg-background border rounded-full text-muted-foreground font-mono">
                  {stageOrders.length}
                </span>
              </div>

              {/* Column Content */}
              <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                {stageOrders.length === 0 ? (
                  <div className="text-xs text-muted-foreground/60 italic text-center py-8 border border-dashed rounded-lg bg-background/50">
                    No garments in this stage
                  </div>
                ) : (
                  stageOrders.map((order) => {
                    const customerName = order.customer
                      ? `${order.customer.firstName} ${order.customer.lastName || ""}`.trim()
                      : "Unknown Customer";

                    const isUpdating = updatingId === order.id;
                    const canGoBack = STAGE_ORDER.indexOf(order.status) > 0;
                    const canGoNext = STAGE_ORDER.indexOf(order.status) < STAGE_ORDER.length - 1;

                    return (
                      <div
                        key={order.id}
                        className="bg-background border rounded-lg p-3 shadow-xs hover:shadow-md transition-shadow relative space-y-2.5"
                      >
                        {/* Header: Garment type + Priority */}
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectOrder?.(order)}
                            className="font-semibold text-sm text-left hover:text-primary transition-colors line-clamp-1"
                          >
                            {order.garmentType}
                          </button>
                          <OrderPriorityBadge priority={order.priority || "MEDIUM"} />
                        </div>

                        {/* Customer */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium">{customerName}</span>
                        </div>

                        {/* Expected Date */}
                        {order.expectedDate && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>
                              {new Date(order.expectedDate).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        )}

                        {/* Payment Status & Total */}
                        <div className="flex items-center justify-between border-t pt-2 text-xs">
                          <PaymentStatusBadge status={order.paymentStatus || "UNPAID"} />
                          <span className="font-mono font-bold text-foreground">
                            ₦{Number(order.totalAmount).toLocaleString("en-US")}
                          </span>
                        </div>

                        {/* Stage Action Controls */}
                        <div className="flex items-center justify-between pt-1 border-t border-dashed">
                          <button
                            type="button"
                            disabled={!canGoBack || isUpdating}
                            onClick={() => handleAdvance(order, "prev")}
                            className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            title="Move to previous stage"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                          </button>

                          {isUpdating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                          ) : (
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                              {stage.name}
                            </span>
                          )}

                          <button
                            type="button"
                            disabled={!canGoNext || isUpdating}
                            onClick={() => handleAdvance(order, "next")}
                            className="p-1 rounded hover:bg-muted text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-0.5"
                            title="Advance to next stage"
                          >
                            {order.status === "READY" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <ArrowRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
