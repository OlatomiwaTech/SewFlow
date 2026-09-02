"use client";

import { useState } from "react";
import type {
  CreateOrderInput,
  Order,
  OrderStatus,
  UpdateOrderInput,
} from "@/types/order";
import { Loader2, DollarSign, Calendar, Shirt } from "lucide-react";

interface OrderFormProps {
  initialData?: Order | null;
  onSubmit: (data: CreateOrderInput | UpdateOrderInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function OrderForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Save Order",
}: Readonly<OrderFormProps>) {
  const [garmentType, setGarmentType] = useState(initialData?.garmentType || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [quantity, setQuantity] = useState<number>(initialData?.quantity ?? 1);
  const [totalAmount, setTotalAmount] = useState<string>(
    initialData ? String(initialData.totalAmount) : "",
  );
  const [depositAmount, setDepositAmount] = useState<string>(
    initialData ? String(initialData.depositAmount) : "0",
  );
  const [status, setStatus] = useState<OrderStatus>(initialData?.status || "PENDING");
  const [expectedDate, setExpectedDate] = useState<string>(
    initialData?.expectedDate ? initialData.expectedDate.split("T")[0] : "",
  );
  const [notes, setNotes] = useState<string>(initialData?.notes || "");
  const [error, setError] = useState<string | null>(null);

  const numTotal = parseFloat(totalAmount) || 0;
  const numDeposit = parseFloat(depositAmount) || 0;
  const computedBalance = Math.max(0, numTotal - numDeposit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!garmentType.trim()) {
      setError("Garment type is required.");
      return;
    }

    if (quantity < 1) {
      setError("Quantity must be at least 1.");
      return;
    }

    if (isNaN(numTotal) || numTotal < 0) {
      setError("Total amount must be 0 or greater.");
      return;
    }

    if (isNaN(numDeposit) || numDeposit < 0) {
      setError("Deposit amount must be 0 or greater.");
      return;
    }

    if (numDeposit > numTotal) {
      setError("Deposit amount cannot exceed the total amount.");
      return;
    }

    const payload: CreateOrderInput | UpdateOrderInput = {
      garmentType: garmentType.trim(),
      description: description.trim() || null,
      quantity,
      totalAmount: numTotal,
      depositAmount: numDeposit,
      status: initialData ? status : undefined,
      expectedDate: expectedDate ? new Date(expectedDate).toISOString() : null,
      notes: notes.trim() || null,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save order.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm font-medium border border-destructive/20">
          {error}
        </div>
      )}

      {/* Garment Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b pb-2">
          <Shirt className="h-4 w-4 text-primary" />
          Garment & Job Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1">
            <label htmlFor="garmentType" className="block text-xs font-semibold text-muted-foreground">
              Garment Type *
            </label>
            <input
              id="garmentType"
              type="text"
              required
              value={garmentType}
              onChange={(e) => setGarmentType(e.target.value)}
              placeholder="e.g. 2-Piece Agbada Suit, Evening Gown, Senator Suit"
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="quantity" className="block text-xs font-semibold text-muted-foreground">
              Quantity *
            </label>
            <input
              id="quantity"
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm font-mono outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="description" className="block text-xs font-semibold text-muted-foreground">
            Description & Style Details
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Fabric type, color, embroidery details, collar style..."
            className="w-full px-3 py-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Pricing & Payments */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b pb-2">
          <DollarSign className="h-4 w-4 text-primary" />
          Pricing & Payments
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label htmlFor="totalAmount" className="block text-xs font-semibold text-muted-foreground">
              Total Price *
            </label>
            <input
              id="totalAmount"
              type="number"
              step="0.01"
              min="0"
              required
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm font-mono outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="depositAmount" className="block text-xs font-semibold text-muted-foreground">
              Deposit Paid
            </label>
            <input
              id="depositAmount"
              type="number"
              step="0.01"
              min="0"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm font-mono outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <span className="block text-xs font-semibold text-muted-foreground">Calculated Balance</span>
            <div className="px-3 py-2 border rounded-lg bg-muted/50 font-mono text-sm font-bold text-foreground">
              ₦{computedBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Status & Schedule */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b pb-2">
          <Calendar className="h-4 w-4 text-primary" />
          Status & Schedule
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {initialData && (
            <div className="space-y-1">
              <label htmlFor="status" className="block text-xs font-semibold text-muted-foreground">
                Order Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full px-3 py-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading}
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="READY">Ready</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="expectedDate" className="block text-xs font-semibold text-muted-foreground">
              Expected Delivery Date
            </label>
            <input
              id="expectedDate"
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label htmlFor="notes" className="block text-xs font-semibold text-muted-foreground">
          Additional Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Special fitting dates, customer reminders..."
          className="w-full px-3 py-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? "Saving Order..." : submitLabel}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
