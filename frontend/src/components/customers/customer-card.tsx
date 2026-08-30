"use client";

import Link from "next/link";
import type { Customer } from "@/types/customer";
import { Edit, Trash2 } from "lucide-react";

interface CustomerCardProps {
  customer: Customer;
  onDelete?: (id: string) => void;
}

export function CustomerCard({ customer, onDelete }: CustomerCardProps) {
  return (
    <div className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">
            {customer.firstName} {customer.lastName}
          </h3>
          <p className="text-sm text-muted-foreground">{customer.phone}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/customers/${customer.id}`}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Link>
          {onDelete && (
            <button
              onClick={() => onDelete(customer.id)}
              className="p-2 hover:bg-destructive/10 text-destructive rounded-md transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {customer.email && (
        <p className="text-sm text-muted-foreground mb-2">{customer.email}</p>
      )}

      {customer.address && (
        <p className="text-sm text-muted-foreground mb-2">{customer.address}</p>
      )}

      {customer.notes && (
        <p className="text-sm text-muted-foreground line-clamp-2 italic">
          {customer.notes}
        </p>
      )}
    </div>
  );
}
