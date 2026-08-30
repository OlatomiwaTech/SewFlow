"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerForm } from "@/components/customers/customer-form";
import { apiClient } from "@/lib/api";
import type { CreateCustomerInput, UpdateCustomerInput } from "@/types/customer";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NewCustomerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateCustomerInput | UpdateCustomerInput) => {
    try {
      setIsLoading(true);
      await apiClient.createCustomer(data as CreateCustomerInput);
      router.push("/customers");
    } catch (error) {
      console.error("Failed to create customer:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/customers"
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold">Add New Customer</h1>
      </div>

      <div className="bg-card p-6 rounded-lg border">
        <CustomerForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel="Create Customer"
        />
      </div>
    </div>
  );
}
