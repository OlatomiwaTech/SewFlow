"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CustomerSearch } from "@/components/customers/customer-search";
import { CustomerList } from "@/components/customers/customer-list";
import { apiClient } from "@/lib/api";
import type { Customer } from "@/types/customer";
import { Plus } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchCustomers();
  }, [search, page]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.listCustomers(page, 10, search);
      setCustomers(data.customers);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) {
      return;
    }

    try {
      await apiClient.deleteCustomer(id);
      setCustomers(customers.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Failed to delete customer:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Link
          href="/customers/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </Link>
      </div>

      <div className="max-w-sm">
        <CustomerSearch onSearch={setSearch} />
      </div>

      <CustomerList
        customers={customers}
        isLoading={isLoading}
        onDelete={handleDelete}
      />
    </div>
  );
}
