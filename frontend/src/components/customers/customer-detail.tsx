"use client";

import type { Customer } from "@/types/customer";
import { Calendar, Mail, MapPin, Phone, FileText } from "lucide-react";

interface CustomerDetailProps {
  customer: Customer;
}

export function CustomerDetail({ customer }: Readonly<CustomerDetailProps>) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {customer.firstName} {customer.lastName}
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {customer.phone && (
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{customer.phone}</p>
            </div>
          </div>
        )}

        {customer.email && (
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{customer.email}</p>
            </div>
          </div>
        )}

        {customer.address && (
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{customer.address}</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">Created</p>
            <p className="font-medium">{formatDate(customer.createdAt)}</p>
          </div>
        </div>
      </div>

      {customer.notes && (
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground mb-2">Notes</p>
            <p className="whitespace-pre-wrap">{customer.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}
