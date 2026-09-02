"use client";

import { useState } from "react";
import type {
  CreatePaymentInput,
  Payment,
  PaymentMethod,
  UpdatePaymentInput,
} from "@/types/payment";
import { Loader2, DollarSign } from "lucide-react";

interface PaymentFormProps {
  initialData?: Payment | null;
  maxAmountAllowed?: number;
  onSubmit: (data: CreatePaymentInput | UpdatePaymentInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function PaymentForm({
  initialData,
  maxAmountAllowed,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Record Payment",
}: Readonly<PaymentFormProps>) {
  const [amount, setAmount] = useState<string>(
    initialData ? String(initialData.amount) : "",
  );
  const [method, setMethod] = useState<PaymentMethod>(
    initialData?.method || "BANK_TRANSFER",
  );
  const [reference, setReference] = useState<string>(
    initialData?.reference || "",
  );
  const [paymentDate, setPaymentDate] = useState<string>(
    initialData?.paymentDate
      ? initialData.paymentDate.split("T")[0]
      : new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState<string>(initialData?.notes || "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Payment amount must be greater than 0.");
      return;
    }

    if (maxAmountAllowed !== undefined && numAmount > maxAmountAllowed) {
      setError(`Payment amount cannot exceed remaining balance (₦${maxAmountAllowed.toLocaleString()}).`);
      return;
    }

    const payload: CreatePaymentInput = {
      amount: numAmount,
      method,
      reference: reference.trim() || null,
      paymentDate: paymentDate ? new Date(paymentDate).toISOString() : null,
      notes: notes.trim() || null,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save payment.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-xl bg-card">
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm font-medium border border-destructive/20">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Amount */}
        <div className="space-y-1">
          <label htmlFor="amount" className="block text-xs font-semibold text-muted-foreground">
            Payment Amount (₦) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono">₦</span>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-7 pr-3 py-2 border rounded-lg bg-background text-sm font-mono outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
          </div>
          {maxAmountAllowed !== undefined && (
            <p className="text-[10px] text-muted-foreground">
              Max allowable: ₦{maxAmountAllowed.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>

        {/* Payment Method */}
        <div className="space-y-1">
          <label htmlFor="method" className="block text-xs font-semibold text-muted-foreground">
            Payment Method *
          </label>
          <select
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className="w-full px-3 py-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          >
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="POS">POS Terminal</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Payment Date */}
        <div className="space-y-1">
          <label htmlFor="paymentDate" className="block text-xs font-semibold text-muted-foreground">
            Payment Date *
          </label>
          <input
            id="paymentDate"
            type="date"
            required
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
        </div>

        {/* Reference */}
        <div className="space-y-1">
          <label htmlFor="reference" className="block text-xs font-semibold text-muted-foreground">
            Reference / Transaction ID
          </label>
          <input
            id="reference"
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. TRX12345678"
            className="w-full px-3 py-2 border rounded-lg bg-background text-sm font-mono outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label htmlFor="notes" className="block text-xs font-semibold text-muted-foreground">
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Receipt notes, bank name, depositor name..."
          className="w-full px-3 py-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <DollarSign className="h-3.5 w-3.5" />
          )}
          {isLoading ? "Saving..." : submitLabel}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
