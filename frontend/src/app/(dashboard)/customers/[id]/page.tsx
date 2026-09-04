"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { CustomerForm } from "@/components/customers/customer-form";
import { CustomerDetail } from "@/components/customers/customer-detail";
import { MeasurementList } from "@/components/measurements/measurement-list";
import { MeasurementForm } from "@/components/measurements/measurement-form";
import { OrderList } from "@/components/orders/order-list";
import { OrderForm } from "@/components/orders/order-form";
import { apiClient } from "@/lib/api";
import type { Customer, UpdateCustomerInput } from "@/types/customer";
import type { CreateMeasurementInput, Measurement } from "@/types/measurement";
import type { CreateOrderInput, Order, UpdateOrderInput } from "@/types/order";
import Link from "next/link";
import { ChevronLeft, Loader2, User, Ruler, Shirt } from "lucide-react";

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;

  const [activeTab, setActiveTab] = useState<"profile" | "measurements" | "orders">("profile");

  // Customer state
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  // Measurement state
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isLoadingMeasurements, setIsLoadingMeasurements] = useState(false);
  const [measurementMode, setMeasurementMode] = useState<"list" | "create" | "edit">("list");
  const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null);
  const [isSavingMeasurement, setIsSavingMeasurement] = useState(false);

  // Order state
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderMode, setOrderMode] = useState<"list" | "create" | "edit">("list");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const fetchCustomer = useCallback(async () => {
    try {
      setIsLoadingCustomer(true);
      const data = await apiClient.getCustomer(customerId);
      setCustomer(data);
    } catch (error) {
      console.error("Failed to fetch customer:", error);
    } finally {
      setIsLoadingCustomer(false);
    }
  }, [customerId]);

  const fetchMeasurements = useCallback(async () => {
    try {
      setIsLoadingMeasurements(true);
      const data = await apiClient.listMeasurements(customerId);
      setMeasurements(data);
    } catch (error) {
      console.error("Failed to fetch measurements:", error);
    } finally {
      setIsLoadingMeasurements(false);
    }
  }, [customerId]);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoadingOrders(true);
      const data = await apiClient.listOrders(customerId);
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomer();
    fetchMeasurements();
    fetchOrders();
  }, [fetchCustomer, fetchMeasurements, fetchOrders]);

  const handleUpdateCustomer = async (data: UpdateCustomerInput) => {
    try {
      setIsSavingCustomer(true);
      const updated = await apiClient.updateCustomer(customerId, data);
      setCustomer(updated);
      setIsEditingCustomer(false);
    } catch (error) {
      console.error("Failed to update customer:", error);
      throw error;
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const handleCreateMeasurement = async (data: CreateMeasurementInput) => {
    try {
      setIsSavingMeasurement(true);
      await apiClient.createMeasurement(customerId, data);
      await fetchMeasurements();
      setMeasurementMode("list");
    } catch (error) {
      console.error("Failed to create measurement:", error);
      throw error;
    } finally {
      setIsSavingMeasurement(false);
    }
  };

  const handleUpdateMeasurement = async (data: CreateMeasurementInput) => {
    if (!selectedMeasurement) return;
    try {
      setIsSavingMeasurement(true);
      await apiClient.updateMeasurement(customerId, selectedMeasurement.id, data);
      await fetchMeasurements();
      setSelectedMeasurement(null);
      setMeasurementMode("list");
    } catch (error) {
      console.error("Failed to update measurement:", error);
      throw error;
    } finally {
      setIsSavingMeasurement(false);
    }
  };

  const handleDeleteMeasurement = async (measurementId: string) => {
    await apiClient.deleteMeasurement(customerId, measurementId);
    await fetchMeasurements();
  };

  const handleCreateOrder = async (data: CreateOrderInput | UpdateOrderInput) => {
    try {
      setIsSavingOrder(true);
      await apiClient.createOrder(customerId, data as CreateOrderInput);
      await fetchOrders();
      setOrderMode("list");
    } catch (error) {
      console.error("Failed to create order:", error);
      throw error;
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleUpdateOrder = async (data: CreateOrderInput | UpdateOrderInput) => {
    if (!selectedOrder) return;
    try {
      setIsSavingOrder(true);
      await apiClient.updateOrder(customerId, selectedOrder.id, data as UpdateOrderInput);
      await fetchOrders();
      setSelectedOrder(null);
      setOrderMode("list");
    } catch (error) {
      console.error("Failed to update order:", error);
      throw error;
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    await apiClient.deleteOrder(customerId, orderId);
    await fetchOrders();
  };

  if (isLoadingCustomer) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Customer not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/customers"
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {customer.firstName} {customer.lastName ?? ""}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Phone: {customer.phone}</p>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "profile"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="h-4 w-4" />
          <span>Profile Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("measurements")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "measurements"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Ruler className="h-4 w-4" />
          <span>Measurements</span>
          {measurements.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              {measurements.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "orders"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Shirt className="h-4 w-4" />
          <span>Orders & Jobs</span>
          {orders.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              {orders.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === "profile" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {isEditingCustomer ? (
              <div className="bg-card p-6 rounded-xl border">
                <CustomerForm
                  initialData={customer}
                  onSubmit={handleUpdateCustomer}
                  isLoading={isSavingCustomer}
                  submitLabel="Save Changes"
                />
                <button
                  type="button"
                  onClick={() => setIsEditingCustomer(false)}
                  disabled={isSavingCustomer}
                  className="mt-4 text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="bg-card p-6 rounded-xl border">
                <CustomerDetail customer={customer} />
                <button
                  type="button"
                  onClick={() => setIsEditingCustomer(true)}
                  className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm"
                >
                  Edit Customer Profile
                </button>
              </div>
            )}
          </div>

          <div className="bg-card p-6 rounded-xl border h-fit space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Customer ID</p>
            <p className="font-mono text-xs break-all">{customer.id}</p>
          </div>
        </div>
      )}

      {/* Tab 2: Measurements */}
      {activeTab === "measurements" && (
        <div className="bg-card p-6 rounded-xl border">
          {measurementMode === "create" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Add New Measurement</h3>
              <MeasurementForm
                onSubmit={handleCreateMeasurement}
                onCancel={() => setMeasurementMode("list")}
                isLoading={isSavingMeasurement}
                submitLabel="Save Measurement Profile"
              />
            </div>
          )}

          {measurementMode === "edit" && selectedMeasurement && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Edit Measurement Profile</h3>
              <MeasurementForm
                initialData={selectedMeasurement}
                onSubmit={handleUpdateMeasurement}
                onCancel={() => {
                  setSelectedMeasurement(null);
                  setMeasurementMode("list");
                }}
                isLoading={isSavingMeasurement}
                submitLabel="Update Measurement Profile"
              />
            </div>
          )}

          {measurementMode === "list" && (
            <MeasurementList
              measurements={measurements}
              isLoading={isLoadingMeasurements}
              onAdd={() => setMeasurementMode("create")}
              onEdit={(m) => {
                setSelectedMeasurement(m);
                setMeasurementMode("edit");
              }}
              onDelete={handleDeleteMeasurement}
            />
          )}
        </div>
      )}

      {/* Tab 3: Orders */}
      {activeTab === "orders" && (
        <div className="bg-card p-6 rounded-xl border">
          {orderMode === "create" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Create New Order</h3>
              <OrderForm
                onSubmit={handleCreateOrder}
                onCancel={() => setOrderMode("list")}
                isLoading={isSavingOrder}
                submitLabel="Create Order"
              />
            </div>
          )}

          {orderMode === "edit" && selectedOrder && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Edit Order / Job Details</h3>
              <OrderForm
                initialData={selectedOrder}
                onSubmit={handleUpdateOrder}
                onCancel={() => {
                  setSelectedOrder(null);
                  setOrderMode("list");
                }}
                isLoading={isSavingOrder}
                submitLabel="Update Order"
              />
            </div>
          )}

          {orderMode === "list" && (
            <OrderList
              orders={orders}
              isLoading={isLoadingOrders}
              onAdd={() => setOrderMode("create")}
              onEdit={(o) => {
                setSelectedOrder(o);
                setOrderMode("edit");
              }}
              onDelete={handleDeleteOrder}
              onOrderUpdated={fetchOrders}
            />
          )}
        </div>
      )}
    </div>
  );
}
