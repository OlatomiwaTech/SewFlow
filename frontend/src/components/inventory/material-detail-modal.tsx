"use client";

import { useState } from "react";
import type { AdjustStockInput, Material, UpdateMaterialInput } from "@/types/inventory";
import { StockStatusBadge } from "./stock-status-badge";
import { StockMovementHistory } from "./stock-movement-history";
import { StockAdjustmentForm } from "./stock-adjustment-form";
import { MaterialForm } from "./material-form";
import { X, Layers, PlusCircle, Edit3, Package, DollarSign, Tag } from "lucide-react";

interface MaterialDetailModalProps {
  material: Material;
  onClose: () => void;
  onAdjustStock: (data: AdjustStockInput) => Promise<void>;
  onUpdateMaterial: (data: UpdateMaterialInput) => Promise<void>;
}

export function MaterialDetailModal({
  material,
  onClose,
  onAdjustStock,
  onUpdateMaterial,
}: Readonly<MaterialDetailModalProps>) {
  const [activeTab, setActiveTab] = useState<"history" | "adjust" | "edit">("history");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStockSubmit = async (data: AdjustStockInput) => {
    setIsSubmitting(true);
    try {
      await onAdjustStock(data);
      setActiveTab("history");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (data: UpdateMaterialInput) => {
    setIsSubmitting(true);
    try {
      await onUpdateMaterial(data);
      setActiveTab("history");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-background border rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-foreground">{material.name}</h3>
              <StockStatusBadge status={material.stockStatus} />
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 font-mono">
              <span className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                SKU: {material.sku || "N/A"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                Category: {material.category}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stock Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/30 p-3 rounded-xl border">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Current Stock</span>
            <div className="text-lg font-bold font-mono text-foreground">
              {material.currentQuantity} {material.unit}
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Low Stock Threshold</span>
            <div className="text-lg font-bold font-mono text-muted-foreground">
              {material.minimumStockLevel} {material.unit}
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Cost / Unit</span>
            <div className="text-lg font-bold font-mono text-foreground">
              ₦{Number(material.costPerUnit).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Estimated Value</span>
            <div className="text-lg font-bold font-mono text-emerald-700">
              ₦{Number(material.estimatedValue).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {material.description && (
          <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg border">
            <strong className="text-foreground">Notes:</strong> {material.description}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="space-y-4">
          <div className="flex border-b gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`pb-2 text-sm font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === "history"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="h-4 w-4" />
              Stock Movement History
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("adjust")}
              className={`pb-2 text-sm font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === "adjust"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <PlusCircle className="h-4 w-4" />
              Adjust Stock
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`pb-2 text-sm font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === "edit"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Edit3 className="h-4 w-4" />
              Edit Material
            </button>
          </div>

          {activeTab === "history" && (
            <StockMovementHistory
              movements={material.stockMovements}
              unit={material.unit}
            />
          )}

          {activeTab === "adjust" && (
            <StockAdjustmentForm
              material={material}
              onSubmit={handleStockSubmit}
              onCancel={() => setActiveTab("history")}
              isLoading={isSubmitting}
            />
          )}

          {activeTab === "edit" && (
            <MaterialForm
              initialData={material}
              onSubmit={handleEditSubmit}
              onCancel={() => setActiveTab("history")}
              isLoading={isSubmitting}
              submitLabel="Update Material Details"
            />
          )}
        </div>
      </div>
    </div>
  );
}
