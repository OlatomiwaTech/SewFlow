"use client";

import { useState } from "react";
import type { AdjustStockInput, Material, MovementType } from "@/types/inventory";
import { Loader2, ArrowUpRight, ArrowDownRight, AlertCircle, Layers } from "lucide-react";

interface StockAdjustmentFormProps {
  material: Material;
  onSubmit: (data: AdjustStockInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const MOVEMENT_TYPES: { value: MovementType; label: string; defaultDir: "add" | "deduct" }[] = [
  { value: "PURCHASE", label: "New Stock / Purchase", defaultDir: "add" },
  { value: "ADJUSTMENT", label: "Manual Adjustment", defaultDir: "add" },
  { value: "USAGE", label: "Production Usage", defaultDir: "deduct" },
  { value: "RETURN", label: "Customer Return", defaultDir: "add" },
  { value: "WASTE", label: "Damaged / Waste", defaultDir: "deduct" },
];

export function StockAdjustmentForm({
  material,
  onSubmit,
  onCancel,
  isLoading = false,
}: Readonly<StockAdjustmentFormProps>) {
  const [movementType, setMovementType] = useState<MovementType>("PURCHASE");
  const [direction, setDirection] = useState<"add" | "deduct">("add");
  const [amountStr, setAmountStr] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const currentQty = Number(material.currentQuantity);
  const amount = parseFloat(amountStr) || 0;
  const signedChange = direction === "add" ? amount : -amount;
  const resultingStock = currentQty + signedChange;

  const handleTypeChange = (type: MovementType) => {
    setMovementType(type);
    const found = MOVEMENT_TYPES.find((m) => m.value === type);
    if (found) {
      setDirection(found.defaultDir);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isNaN(amount) || amount <= 0) {
      setError("Adjustment quantity must be a positive number greater than 0.");
      return;
    }

    if (resultingStock < 0) {
      setError(
        `Cannot deduct ${amount} ${material.unit}. Stock would become negative (${resultingStock} ${material.unit}).`,
      );
      return;
    }

    try {
      await onSubmit({
        type: movementType,
        quantityChange: signedChange,
        notes: notes.trim() || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record stock adjustment.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm font-medium border border-destructive/20 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Material Stock Preview Banner */}
      <div className="bg-muted/40 border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="font-bold text-sm text-foreground">{material.name}</div>
          <div className="text-xs text-muted-foreground font-mono">
            SKU: {material.sku || "N/A"} | Category: {material.category}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-semibold text-muted-foreground uppercase">Current Stock</div>
          <div className="text-lg font-bold font-mono text-primary">
            {currentQty} {material.unit}
          </div>
        </div>
      </div>

      {/* Movement Type & Direction */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="movementType" className="block text-xs font-semibold text-muted-foreground">
              Reason / Movement Type *
            </label>
            <select
              id="movementType"
              value={movementType}
              onChange={(e) => handleTypeChange(e.target.value as MovementType)}
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            >
              {MOVEMENT_TYPES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <span className="block text-xs font-semibold text-muted-foreground">Action</span>
            <div className="flex rounded-lg border p-1 bg-muted/30">
              <button
                type="button"
                onClick={() => setDirection("add")}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  direction === "add"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ArrowUpRight className="h-4 w-4" /> Add (+)
              </button>

              <button
                type="button"
                onClick={() => setDirection("deduct")}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  direction === "deduct"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ArrowDownRight className="h-4 w-4" /> Deduct (-)
              </button>
            </div>
          </div>
        </div>

        {/* Quantity Change & Resulting Calculation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="amountStr" className="block text-xs font-semibold text-muted-foreground">
              Quantity Change ({material.unit}) *
            </label>
            <input
              id="amountStr"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="e.g. 10"
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm font-mono outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <span className="block text-xs font-semibold text-muted-foreground">Resulting Stock Preview</span>
            <div
              className={`px-3 py-2 border rounded-lg font-mono text-sm font-bold flex items-center justify-between ${
                resultingStock < 0
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-muted/50 text-foreground"
              }`}
            >
              <span>{currentQty} {material.unit}</span>
              <span>→</span>
              <span>{resultingStock.toFixed(2)} {material.unit}</span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="notes" className="block text-xs font-semibold text-muted-foreground">
            Notes / Reference
          </label>
          <input
            id="notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Supplier Invoice #402, Received 10 yards Navy Silk"
            className="w-full px-3 py-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? "Recording Adjustment..." : "Record Stock Adjustment"}
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
