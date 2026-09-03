"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api";
import type { Order, OrderPriority, OrderStatus, ProductionMetrics } from "@/types/order";
import { ProductionBoard } from "@/components/production/production-board";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderPriorityBadge } from "@/components/orders/order-priority-badge";
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge";
import { OrderHistoryTimeline } from "@/components/orders/order-history-timeline";
import { PaymentList } from "@/components/payments/payment-list";
import {
  Kanban,
  List,
  Search,
  Filter,
  RefreshCw,
  Scissors,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  X,
  User,
  Calendar,
  Clock,
} from "lucide-react";

export default function ProductionOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [metrics, setMetrics] = useState<ProductionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<"history" | "payments">("history");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ordersData, metricsData] = await Promise.all([
        apiClient.listAllOrders({
          ...(priorityFilter !== "ALL" && { priority: priorityFilter }),
          ...(searchQuery.trim() && { search: searchQuery.trim() }),
        }),
        apiClient.getProductionMetrics(),
      ]);

      setOrders(ordersData);
      setMetrics(metricsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, [priorityFilter, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (
    customerId: string,
    orderId: string,
    newStatus: OrderStatus,
  ) => {
    try {
      await apiClient.updateOrder(customerId, orderId, { status: newStatus });
      await fetchData();
      if (selectedOrder && selectedOrder.id === orderId) {
        const updated = await apiClient.getOrder(customerId, orderId);
        setSelectedOrder(updated);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update order status");
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (priorityFilter !== "ALL" && o.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const garment = o.garmentType.toLowerCase();
      const customer = o.customer
        ? `${o.customer.firstName} ${o.customer.lastName || ""}`.toLowerCase()
        : "";
      return garment.includes(q) || customer.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Scissors className="h-6 w-6 text-primary" />
            Production Workflow
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage garment jobs, track stage progression, and view production shop performance.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3 py-2 border text-sm font-medium rounded-lg hover:bg-muted transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Header Overview */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Active Jobs</span>
              <Scissors className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold mt-2 font-mono">{metrics.activeOrders}</div>
            <div className="text-xs text-muted-foreground mt-1">In production pipeline</div>
          </div>

          <div className="bg-card border rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Urgent Jobs</span>
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold mt-2 font-mono text-rose-600">{metrics.urgentOrders}</div>
            <div className="text-xs text-muted-foreground mt-1">High / Urgent priority</div>
          </div>

          <div className="bg-card border rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Completed Jobs</span>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold mt-2 font-mono text-emerald-600">{metrics.completedOrders}</div>
            <div className="text-xs text-muted-foreground mt-1">Delivered to clients</div>
          </div>

          <div className="bg-card border rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Outstanding Balance</span>
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold mt-2 font-mono text-amber-600">
              ₦{metrics.balanceOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Pending collection</div>
          </div>
        </div>
      )}

      {/* Filters & View Controls */}
      <div className="bg-card border rounded-xl p-4 shadow-2xs flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search garment or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-lg text-sm bg-background w-full outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent Only</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center border rounded-lg p-1 bg-muted/50 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              viewMode === "kanban"
                ? "bg-background shadow-xs text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Kanban className="h-3.5 w-3.5" />
            Kanban Board
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              viewMode === "list"
                ? "bg-background shadow-xs text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            List Table
          </button>
        </div>
      </div>

      {/* Main Content */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm font-medium border border-destructive/20">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground text-sm font-medium">
          Loading production pipeline...
        </div>
      ) : viewMode === "kanban" ? (
        <ProductionBoard
          orders={filteredOrders}
          onStatusChange={handleStatusChange}
          onSelectOrder={(order) => setSelectedOrder(order)}
        />
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Garment / Style</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Stage Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Total / Balance</th>
                  <th className="px-4 py-3">Expected Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground italic">
                      No orders matching current filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const customerName = order.customer
                      ? `${order.customer.firstName} ${order.customer.lastName || ""}`.trim()
                      : "Unknown Customer";

                    return (
                      <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {order.garmentType}
                          {order.description && (
                            <div className="text-xs text-muted-foreground font-normal line-clamp-1">
                              {order.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-medium">
                          {customerName}
                        </td>
                        <td className="px-4 py-3">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3">
                          <OrderPriorityBadge priority={order.priority || "MEDIUM"} />
                        </td>
                        <td className="px-4 py-3">
                          <PaymentStatusBadge status={order.paymentStatus || "UNPAID"} />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          <div className="font-bold text-foreground">
                            ₦{Number(order.totalAmount).toLocaleString("en-US")}
                          </div>
                          {Number(order.balanceDue) > 0 && (
                            <div className="text-amber-600 font-semibold">
                              Due: ₦{Number(order.balanceDue).toLocaleString("en-US")}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                          {order.expectedDate
                            ? new Date(order.expectedDate).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-xs font-medium transition-colors"
                          >
                            View Job
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details & Audit History Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-foreground">{selectedOrder.garmentType}</h3>
                  <OrderPriorityBadge priority={selectedOrder.priority || "MEDIUM"} />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1 font-medium">
                    <User className="h-3.5 w-3.5" />
                    {selectedOrder.customer
                      ? `${selectedOrder.customer.firstName} ${selectedOrder.customer.lastName || ""}`
                      : "Customer"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="h-3.5 w-3.5" />
                    Expected:{" "}
                    {selectedOrder.expectedDate
                      ? new Date(selectedOrder.expectedDate).toLocaleDateString()
                      : "Not specified"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Status Stage Update Selector */}
            <div className="bg-muted/40 border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                Current Stage Status
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <OrderStatusBadge status={selectedOrder.status} />
                <select
                  value={selectedOrder.status}
                  onChange={(e) =>
                    handleStatusChange(
                      selectedOrder.customerId,
                      selectedOrder.id,
                      e.target.value as OrderStatus,
                    )
                  }
                  className="px-2.5 py-1.5 border rounded-lg text-xs bg-background font-medium outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="NEW">New Order</option>
                  <option value="MEASURED">Measured</option>
                  <option value="CUTTING">Cutting</option>
                  <option value="SEWING">Sewing</option>
                  <option value="FITTING">Fitting</option>
                  <option value="READY">Ready</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Tabs for Audit Log & Payment History */}
            <div className="space-y-4">
              <div className="flex border-b gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={`pb-2 text-sm font-semibold transition-colors border-b-2 ${
                    activeTab === "history"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Status History & Audit Trail
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("payments")}
                  className={`pb-2 text-sm font-semibold transition-colors border-b-2 ${
                    activeTab === "payments"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Payment Breakdown
                </button>
              </div>

              {activeTab === "history" ? (
                <OrderHistoryTimeline history={selectedOrder.history} />
              ) : (
                <PaymentList
                  payments={selectedOrder.payments || []}
                  onEdit={() => {}}
                  onDelete={async (paymentId) => {
                    await apiClient.deletePayment(
                      selectedOrder.customerId,
                      selectedOrder.id,
                      paymentId,
                    );
                    await fetchData();
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
