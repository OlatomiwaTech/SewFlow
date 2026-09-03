"use client";

import { useState } from "react";
import type {
  CreateMaterialInput,
  Material,
  MaterialCategory,
  MaterialUnit,
  UpdateMaterialInput,
} from "@/types/inventory";
import { Loader2, Package, Layers, DollarSign, AlertCircle } from "lucide-react";

interface MaterialFormProps {
  initialData?: Material | null;
  onSubmit: (data: CreateMaterialInput | UpdateMaterialInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const CATEGORIES: { value: MaterialCategory; label: string }[] = [
  { value: "FABRIC", label: "Fabric" },
  { value: "THREAD", label: "Thread" },
  { value: "BUTTON", label: "Buttons" },
  { value: "ZIPPER", label: "Zippers" },
  { value: "LINING", label: "Lining" },
  { value: "INTERFACING", label: "Interfacing" },
  { value: "ELASTIC", label: "Elastic" },
  { value: "OTHER", label: "Other" },
];

const UNITS: { value: MaterialUnit; label: string }[] = [
  { value: "YARD", label: "Yards" },
  { value: "METER", label: "Meters" },
  { value: "PIECE", label: "Pieces" },
  { value: "ROLL", label: "Rolls" },
  { value: "SPOOL", label: "Spools" },
  { value: "PACK", label: "Packs" },
  { value: "OTHER", label: "Other Units" },
];

export function MaterialForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Save Material",
}: Readonly<MaterialFormProps>) {
  const [name, setName] = useState(initialData?.name || "");
  const [sku, setSku] = useState(initialData?.sku || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [category, setCategory] = useState<MaterialCategory>(
    initialData?.category || "FABRIC",
  );
  const [unit, setUnit] = useState<MaterialUnit>(initialData?.unit || "YARD");
  const [initialQuantity, setInitialQuantity] = useState<string>(
    initialData ? String(initialData.currentQuantity) : "0",
  );
  const [minimumStockLevel, setMinimumStockLevel] = useState<string>(
    initialData ? String(initialData.minimumStockLevel) : "5",
  );
  const [costPerUnit, setCostPerUnit] = useState<string>(
    initialData ? String(initialData.costPerUnit) : "0",
  );
  const [error, setError] = useState<string | null>(null);

  const numInitialQty = parseFloat(initialQuantity) || 0;
  const numMinStock = parseFloat(minimumStockLevel) || 0;
  const numCost = parseFloat(costPerUnit) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Material name is required.");
      return;
    }

    if (!initialData && (isNaN(numInitialQty) || numInitialQty < 0)) {
      setError("Initial quantity cannot be negative.");
      return;
    }

    if (isNaN(numMinStock) || numMinStock < 0) {
      setError("Minimum stock level cannot be negative.");
      return;
    }

    if (isNaN(numCost) || numCost < 0) {
      setError("Cost per unit cannot be negative.");
      return;
    }

    const payload: CreateMaterialInput | UpdateMaterialInput = {
      name: name.trim(),
      sku: sku.trim() || null,
      description: description.trim() || null,
      category,
      unit,
      minimumStockLevel: numMinStock,
      costPerUnit: numCost,
      ...(!initialData && { initialQuantity: numInitialQty }),
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save material.");
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

      {/* Material Identification */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b pb-2">
          <Package className="h-4 w-4 text-primary" />
          Material Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1">
            <label htmlFor="name" className="block text-xs font-semibold text-muted-foreground">
              Material Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Royal Blue Silk Satin, YKK Invisible Zipper 12-inch"
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="sku" className="block text-xs font-semibold text-muted-foreground">
              SKU / Material Code
            </label>
            <input
              id="sku"
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. FAB-SAT-001"
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm font-mono outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="category" className="block text-xs font-semibold text-muted-foreground">
              Category *
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as MaterialCategory)}
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="unit" className="block text-xs font-semibold text-muted-foreground">
              Unit of Measurement *
            </label>
            <select
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value as MaterialUnit)}
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            >
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="description" className="block text-xs font-semibold text-muted-foreground">
            Description & Notes
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Color code, width, stretch, storage location..."
            className="w-full px-3 py-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Stock Thresholds & Cost */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b pb-2">
          <Layers className="h-4 w-4 text-primary" />
          Stock Levels & Unit Cost
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {!initialData && (
            <div className="space-y-1">
              <label htmlFor="initialQuantity" className="block text-xs font-semibold text-muted-foreground">
                Initial Stock Quantity *
              </label>
              <input
                id="initialQuantity"
                type="number"
                step="0.01"
                min="0"
                required
                value={initialQuantity}
                onChange={(e) => setInitialQuantity(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border rounded-lg bg-background text-sm font-mono outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading}
              />
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="minimumStockLevel" className="block text-xs font-semibold text-muted-foreground">
              Low Stock Threshold *
            </label>
            <input
              id="minimumStockLevel"
              type="number"
              step="0.01"
              min="0"
              required
              value={minimumStockLevel}
              onChange={(e) => setMinimumStockLevel(e.target.value)}
              placeholder="5"
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm font-mono outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="costPerUnit" className="block text-xs font-semibold text-muted-foreground">
              Cost Per Unit (₦)
            </label>
            <input
              id="costPerUnit"
              type="number"
              step="0.01"
              min="0"
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm font-mono outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? "Saving Material..." : submitLabel}
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
