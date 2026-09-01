"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Customer, CustomerListResponse } from "@/types/customer";
import { CustomerList } from "@/components/customers/customer-list";
import { apiClient } from "@/lib/api";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const data: CustomerListResponse = await apiClient.listCustomers(page, 10, search || undefined);
      setCustomers(data.data);
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
      await fetchCustomers();
    } catch (error) {
      console.error("Failed to delete customer:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <header>
          <p className="text-sm text-muted-foreground">
            Customer management
          </p>
          <h1 className="text-3xl font-semibold">
            Customers
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your customers and their tailoring history.
          </p>
        </header>
        <Link
          href="/customers/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </Link>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full px-4 py-2 border rounded-lg bg-background"
        />
        <CustomerList
          customers={customers}
          isLoading={isLoading}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
