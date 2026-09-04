"use client";

import { useEffect, useState, useCallback } from "react";
import type { OrderMaterial } from "@/types/order";
import type { Material } from "@/types/inventory";
import { apiClient } from "@/lib/api";
import { Package, Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface OrderMaterialsSectionProps {
  customerId: string;
  orderId: string;
}

export function OrderMaterialsSection({
  customerId,
  orderId,
}: Readonly<OrderMaterialsSectionProps>) {
  const [orderMaterials, setOrderMaterials] = useState<OrderMaterial[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsSaving] = useState(false);

  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [plannedQty, setPlannedQty] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const [consumingItem, setConsumingItem] = useState<OrderMaterial | null>(null);
  const [actualQty, setActualQty] = useState("");
  const [consumeNotes, setConsumeNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [omData, matData] = await Promise.all([
        apiClient.listOrderMaterials(customerId, orderId),
        apiClient.listMaterials({ status: "ALL" }),
      ]);
      setOrderMaterials(omData);
      setAvailableMaterials(matData.filter((m) => m.isActive));
    } catch (err) {
      console.error("Failed to load order materials:", err);
      setError("Failed to load materials history.");
    } finally {
      setIsLoading(false);
    }
  }, [customerId, orderId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddPlanned = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialId || !plannedQty || Number(plannedQty) <= 0) {
      setError("Please select a valid material and positive planned quantity.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await apiClient.addPlannedMaterial(customerId, orderId, {
        materialId: selectedMaterialId,
        plannedQuantity: Number(plannedQty),
        notes: addNotes.trim() || undefined,
      });

      setSelectedMaterialId("");
      setPlannedQty("");
      setAddNotes("");
      setShowAddForm(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to add planned material.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecordConsumption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumingItem || actualQty === "" || Number(actualQty) < 0) {
      setError("Please enter a valid actual quantity.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await apiClient.recordActualConsumption(customerId, orderId, consumingItem.id, {
        actualQuantity: Number(actualQty),
        notes: consumeNotes.trim() || undefined,
      });

      setConsumingItem(null);
      setActualQty("");
      setConsumeNotes("");
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to record consumption.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (orderMaterialId: string) => {
    if (!globalThis.confirm("Are you sure you want to remove this material from the order? Stock will be restored if actual consumption was recorded.")) {
      return;
    }

    try {
      setError(null);
      await apiClient.deleteOrderMaterial(customerId, orderId, orderMaterialId);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to remove material.");
    }
  };

  const totalMaterialCost = orderMaterials.reduce(
    (sum, m) => sum + (Number(m.totalCost) || 0),
    0,
  );

  return (
    <div className="rounded-xl border p-5 bg-card/30 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Materials & Fabric Usage
          </h4>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">
            Total Material Cost:{" "}
            <strong className="font-mono text-foreground font-bold">
              ₦{totalMaterialCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </span>

          {!showAddForm && !consumingItem && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Planned Material
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Planned Material Form */}
      {showAddForm && (
        <form onSubmit={handleAddPlanned} className="p-4 border rounded-lg bg-card space-y-3">
          <h5 className="text-xs font-bold uppercase text-muted-foreground">Add Material to Plan</h5>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="materialSelect" className="block text-xs font-medium mb-1">
                Select Material
              </label>
              <select
                id="materialSelect"
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                required
                className="w-full text-xs rounded-lg border bg-background px-3 py-2"
              >
                <option value="">-- Choose Material --</option>
                {availableMaterials.map((mat) => (
                  <option key={mat.id} value={mat.id}>
                    {mat.name} ({mat.category}) - Stock: {mat.currentQuantity} {mat.unit} @ ₦{Number(mat.costPerUnit).toLocaleString()}/{mat.unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="plannedQtyInput" className="block text-xs font-medium mb-1">
                Planned Quantity
              </label>
              <input
                id="plannedQtyInput"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 3.5"
                value={plannedQty}
                onChange={(e) => setPlannedQty(e.target.value)}
                required
                className="w-full text-xs rounded-lg border bg-background px-3 py-2 font-mono"
              />
            </div>
          </div>

          <div>
            <label htmlFor="addNotesInput" className="block text-xs font-medium mb-1">
              Notes (Optional)
            </label>
            <input
              id="addNotesInput"
              type="text"
              placeholder="e.g. For shirt body and sleeves"
              value={addNotes}
              onChange={(e) => setAddNotes(e.target.value)}
              className="w-full text-xs rounded-lg border bg-background px-3 py-2"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs border rounded-lg hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdding}
              className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 flex items-center gap-1.5"
            >
              {isAdding && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>Add Material</span>
            </button>
          </div>
        </form>
      )}

      {/* Record Consumption Modal/Form */}
      {consumingItem && (
        <form onSubmit={handleRecordConsumption} className="p-4 border rounded-lg bg-card space-y-3 border-primary/30">
          <h5 className="text-xs font-bold uppercase text-primary">
            Record Actual Material Consumed: {consumingItem.material?.name || "Material"}
          </h5>

          <p className="text-xs text-muted-foreground">
            Planned: <strong>{consumingItem.plannedQuantity} {consumingItem.unit}</strong> | Unit Cost: <strong>₦{Number(consumingItem.unitCost).toLocaleString()}/{consumingItem.unit}</strong> | Available Inventory: <strong>{consumingItem.material?.currentQuantity ?? "—"} {consumingItem.unit}</strong>
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="actualQtyInput" className="block text-xs font-medium mb-1">
                Actual Quantity Consumed
              </label>
              <input
                id="actualQtyInput"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 3.2"
                value={actualQty}
                onChange={(e) => setActualQty(e.target.value)}
                required
                className="w-full text-xs rounded-lg border bg-background px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label htmlFor="consumeNotesInput" className="block text-xs font-medium mb-1">
                Notes
              </label>
              <input
                id="consumeNotesInput"
                type="text"
                placeholder="e.g. 0.3 yards saved after cutting"
                value={consumeNotes}
                onChange={(e) => setConsumeNotes(e.target.value)}
                className="w-full text-xs rounded-lg border bg-background px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setConsumingItem(null)}
              className="px-3 py-1.5 text-xs border rounded-lg hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdding}
              className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 flex items-center gap-1.5"
            >
              {isAdding && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>Deduct Inventory & Record</span>
            </button>
          </div>
        </form>
      )}

      {/* Materials List */}
      {isLoading ? (
        <div className="py-6 flex justify-center text-muted-foreground text-xs">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading materials...
        </div>
      ) : orderMaterials.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          No materials recorded for this order yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-muted-foreground uppercase text-[10px] tracking-wider">
                <th className="pb-2 font-semibold">Material</th>
                <th className="pb-2 font-semibold text-right">Planned</th>
                <th className="pb-2 font-semibold text-right">Actual Consumed</th>
                <th className="pb-2 font-semibold text-right">Unit Cost</th>
                <th className="pb-2 font-semibold text-right">Total Cost</th>
                <th className="pb-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orderMaterials.map((item) => {
                const isConsumed = Number(item.actualQuantity) > 0;
                return (
                  <tr key={item.id} className="hover:bg-accent/50 transition-colors">
                    <td className="py-2.5 pr-2">
                      <div className="font-semibold text-foreground">
                        {item.material?.name || "Unknown Material"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Category: {item.material?.category || "N/A"}
                        {item.notes ? ` • ${item.notes}` : ""}
                      </div>
                    </td>

                    <td className="py-2.5 px-2 text-right font-mono">
                      {item.plannedQuantity} {item.unit}
                    </td>

                    <td className="py-2.5 px-2 text-right font-mono">
                      {isConsumed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle2 className="h-3 w-3" />
                          {item.actualQuantity} {item.unit}
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-sans italic">Not recorded</span>
                      )}
                    </td>

                    <td className="py-2.5 px-2 text-right font-mono text-muted-foreground">
                      ₦{Number(item.unitCost).toLocaleString()}/{item.unit}
                    </td>

                    <td className="py-2.5 px-2 text-right font-mono font-bold">
                      ₦{Number(item.totalCost).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-2.5 pl-2 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setConsumingItem(item);
                          setActualQty(item.actualQuantity ? String(item.actualQuantity) : String(item.plannedQuantity));
                          setConsumeNotes(item.notes || "");
                        }}
                        className="px-2 py-1 text-[11px] font-medium border rounded hover:bg-accent transition-colors"
                      >
                        {isConsumed ? "Edit Consumption" : "Record Consumption"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                        title="Delete material"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
