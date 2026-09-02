"use client";

import { useState } from "react";
import type { Payment, PaymentMethod } from "@/types/payment";
import { DollarSign, Calendar, Edit, Trash2, Loader2, CreditCard } from "lucide-react";

interface PaymentListProps {
  payments: Payment[];
  isLoading?: boolean;
  onEdit: (payment: Payment) => void;
  onDelete: (paymentId: string) => Promise<void>;
}

export function PaymentList({
  payments,
  isLoading = false,
  onEdit,
  onDelete,
}: Readonly<PaymentListProps>) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const methodLabels: Record<PaymentMethod, string> = {
    BANK_TRANSFER: "Bank Transfer",
    CASH: "Cash",
    CARD: "Card",
    POS: "POS Terminal",
    OTHER: "Other",
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment record?")) {
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
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center bg-card/50">
        <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground font-medium">
          No payment records logged for this order yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((p) => {
        const amt = Number(p.amount);

        return (
          <div
            key={p.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border rounded-lg bg-card/60 gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-foreground">
                    ₦{amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {methodLabels[p.method] || p.method}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(p.paymentDate)}
                  </span>
                  {p.reference && (
                    <span className="font-mono text-[11px] bg-muted/60 px-1.5 py-0.5 rounded">
                      Ref: {p.reference}
                    </span>
                  )}
                </div>
                {p.notes && <p className="text-xs text-muted-foreground italic">{p.notes}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => onEdit(p)}
                title="Edit payment"
                className="p-1.5 hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-foreground"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleDelete(p.id)}
                disabled={deletingId === p.id}
                title="Delete payment"
                className="p-1.5 hover:bg-destructive/10 text-destructive rounded-md transition-colors disabled:opacity-50"
              >
                {deletingId === p.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
