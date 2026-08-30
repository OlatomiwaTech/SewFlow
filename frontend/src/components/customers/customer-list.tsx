"use client";

import type { Customer } from "@/types/customer";
import { CustomerCard } from "./customer-card";

interface CustomerListProps {
  customers: Customer[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
}

export function CustomerList({
  customers,
  isLoading = false,
  onDelete,
}: Readonly<CustomerListProps>) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array.from({ length: 6 })].map(() => (
          <div
            key={crypto.getRandomValues(new Uint8Array(16)).toString()}
            className="p-4 border rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No customers found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {customers.map((customer) => (
        <CustomerCard
          key={customer.id}
          customer={customer}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
