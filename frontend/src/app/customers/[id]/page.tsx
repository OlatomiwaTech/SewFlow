"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { CustomerForm } from "@/components/customers/customer-form";
import { CustomerDetail } from "@/components/customers/customer-detail";
import { apiClient } from "@/lib/api";
import type { Customer, UpdateCustomerInput } from "@/types/customer";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getCustomer(customerId);
      setCustomer(data);
    } catch (error) {
      console.error("Failed to fetch customer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateCustomerInput) => {
    try {
      setIsSaving(true);
      const updated = await apiClient.updateCustomer(customerId, data);
      setCustomer(updated);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update customer:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
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
      <div className="flex items-center gap-4">
        <Link
          href="/customers"
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold">
          {isEditing ? "Edit Customer" : "Customer Details"}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isEditing ? (
            <div className="bg-card p-6 rounded-lg border">
              <CustomerForm
                initialData={customer}
                onSubmit={handleSubmit}
                isLoading={isSaving}
                submitLabel="Save Changes"
              />
              <button
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="mt-4 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="bg-card p-6 rounded-lg border">
              <CustomerDetail customer={customer} />
              <button
                onClick={() => setIsEditing(true)}
                className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Edit Customer
              </button>
            </div>
          )}
        </div>

        <div className="bg-card p-6 rounded-lg border h-fit">
          <p className="text-sm text-muted-foreground">Customer ID</p>
          <p className="font-mono text-xs mt-1 break-all">{customer.id}</p>
        </div>
      </div>
    </div>
  );
}
