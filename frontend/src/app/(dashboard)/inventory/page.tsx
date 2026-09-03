"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api";
import type {
  AdjustStockInput,
  CreateMaterialInput,
  InventorySummary,
  Material,
  MaterialCategory,
  StockStatus,
  UpdateMaterialInput,
} from "@/types/inventory";
import { StockStatusBadge } from "@/components/inventory/stock-status-badge";
import { MaterialForm } from "@/components/inventory/material-form";
import { MaterialDetailModal } from "@/components/inventory/material-detail-modal";
import { StockAdjustmentForm } from "@/components/inventory/stock-adjustment-form";
import {
  Package,
  Plus,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Layers,
  ArrowUpDown,
  X,
} from "lucide-react";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "ALL", label: "All Categories" },
  { value: "FABRIC", label: "Fabrics" },
  { value: "THREAD", label: "Threads" },
  { value: "BUTTON", label: "Buttons" },
  { value: "ZIPPER", label: "Zippers" },
  { value: "LINING", label: "Linings" },
  { value: "INTERFACING", label: "Interfacing" },
  { value: "ELASTIC", label: "Elastic" },
  { value: "OTHER", label: "Other Supplies" },
];

export default function InventoryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [adjustingMaterial, setAdjustingMaterial] = useState<Material | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [materialsData, summaryData] = await Promise.all([
        apiClient.listMaterials({
          ...(categoryFilter !== "ALL" && { category: categoryFilter }),
          ...(statusFilter !== "ALL" && { status: statusFilter }),
          ...(searchQuery.trim() && { search: searchQuery.trim() }),
        }),
        apiClient.getInventorySummary(),
      ]);

      setMaterials(materialsData);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, statusFilter, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateMaterial = async (data: CreateMaterialInput | UpdateMaterialInput) => {
    setIsSubmitting(true);
    try {
      await apiClient.createMaterial(data as CreateMaterialInput);
      setIsAddModalOpen(false);
      await fetchData();
    } catch (err) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustStock = async (materialId: string, data: AdjustStockInput) => {
    try {
      const updated = await apiClient.adjustStock(materialId, data);
      await fetchData();
      if (selectedMaterial && selectedMaterial.id === materialId) {
        setSelectedMaterial(updated);
      }
      setAdjustingMaterial(null);
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateMaterial = async (materialId: string, data: UpdateMaterialInput) => {
    try {
      const updated = await apiClient.updateMaterial(materialId, data);
      await fetchData();
      if (selectedMaterial && selectedMaterial.id === materialId) {
        setSelectedMaterial(updated);
      }
    } catch (err) {
      throw err;
    }
  };

  const filteredMaterials = materials.filter((m) => {
    if (categoryFilter !== "ALL" && m.category !== categoryFilter) return false;
    if (statusFilter !== "ALL" && m.stockStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = m.name.toLowerCase();
      const sku = (m.sku || "").toLowerCase();
      const desc = (m.description || "").toLowerCase();
      return name.includes(q) || sku.includes(q) || desc.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Inventory & Materials
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage fabric catalogue, thread & trimmings stock, and auditable stock movement logs.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 border text-sm font-medium rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            Add Material
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Total Materials</span>
              <Package className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold mt-2 font-mono">{summary.totalMaterials ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">{summary.activeMaterials ?? 0} active catalogue items</div>
          </div>

          <div className="bg-card border rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Low Stock Alert</span>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold mt-2 font-mono text-amber-600">{summary.lowStockMaterials ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">At or below threshold</div>
          </div>

          <div className="bg-card border rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Out of Stock</span>
              <XCircle className="h-4 w-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold mt-2 font-mono text-rose-600">{summary.outOfStockMaterials ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Zero quantity items</div>
          </div>

          <div className="bg-card border rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Inventory Value</span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold mt-2 font-mono text-emerald-700">
              ₦{(summary.totalInventoryValue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Estimated stock value</div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-card border rounded-xl p-4 shadow-2xs flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search material name, SKU, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-lg text-sm bg-background w-full outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-primary"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">All Stock Statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock Alert</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm font-medium border border-destructive/20">
          {error}
        </div>
      )}

      <div className="bg-card border rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Material / SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Current Stock</th>
                <th className="px-4 py-3">Min Threshold</th>
                <th className="px-4 py-3">Cost / Unit</th>
                <th className="px-4 py-3">Estimated Value</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm font-medium">
                    Loading inventory catalogue...
                  </td>
                </tr>
              ) : filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground italic">
                    No materials found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{m.name}</div>
                      {m.sku && (
                        <div className="text-xs font-mono text-muted-foreground">
                          SKU: {m.sku}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                      <span className="px-2 py-0.5 rounded bg-muted border text-foreground">
                        {m.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-foreground">
                      {m.currentQuantity} {m.unit}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {m.minimumStockLevel} {m.unit}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">
                      ₦{Number(m.costPerUnit).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-emerald-700">
                      ₦{Number(m.estimatedValue).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <StockStatusBadge status={m.stockStatus} />
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setAdjustingMaterial(m)}
                        className="px-2.5 py-1 bg-muted hover:bg-accent text-foreground rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1"
                      >
                        <ArrowUpDown className="h-3 w-3" /> Adjust
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMaterial(m)}
                        className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-xs font-medium transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Material Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Add New Inventory Material
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <MaterialForm
              onSubmit={handleCreateMaterial}
              onCancel={() => setIsAddModalOpen(false)}
              isLoading={isSubmitting}
              submitLabel="Add to Catalogue"
            />
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustingMaterial && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-primary" />
                Adjust Stock Quantity
              </h3>
              <button
                type="button"
                onClick={() => setAdjustingMaterial(null)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <StockAdjustmentForm
              material={adjustingMaterial}
              onSubmit={(data) => handleAdjustStock(adjustingMaterial.id, data)}
              onCancel={() => setAdjustingMaterial(null)}
            />
          </div>
        </div>
      )}

      {/* Material Detail & Movement Audit Modal */}
      {selectedMaterial && (
        <MaterialDetailModal
          material={selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
          onAdjustStock={(data) => handleAdjustStock(selectedMaterial.id, data)}
          onUpdateMaterial={(data) => handleUpdateMaterial(selectedMaterial.id, data)}
        />
      )}
    </div>
  );
}
