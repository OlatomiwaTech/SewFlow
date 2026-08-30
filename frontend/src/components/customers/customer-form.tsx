"use client";

import { useState } from "react";
import type { CreateCustomerInput, UpdateCustomerInput } from "@/types/customer";

interface CustomerFormProps {
  initialData?: CreateCustomerInput | UpdateCustomerInput;
  onSubmit: (data: CreateCustomerInput | UpdateCustomerInput) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function CustomerForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitLabel = "Save Customer",
}: CustomerFormProps) {
  const [formData, setFormData] = useState<CreateCustomerInput | UpdateCustomerInput>(
    initialData || {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.phone?.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="firstName" className="block text-sm font-medium mb-1">
          First Name *
        </label>
        <input
          id="firstName"
          type="text"
          name="firstName"
          value={formData.firstName || ""}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg"
          disabled={isLoading}
        />
        {errors.firstName && (
          <p className="text-sm text-destructive mt-1">{errors.firstName}</p>
        )}
      </div>

      <div>
        <label htmlFor="lastName" className="block text-sm font-medium mb-1">
          Last Name
        </label>
        <input
          id="lastName"
          type="text"
          name="lastName"
          value={formData.lastName || ""}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-1">
          Phone *
        </label>
        <input
          id="phone"
          type="tel"
          name="phone"
          value={formData.phone || ""}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg"
          disabled={isLoading}
        />
        {errors.phone && (
          <p className="text-sm text-destructive mt-1">{errors.phone}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          name="email"
          value={formData.email || ""}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium mb-1">
          Address
        </label>
        <input
          id="address"
          type="text"
          name="address"
          value={formData.address || ""}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes || ""}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg min-h-24"
          disabled={isLoading}
        />
      </div>

      {errors.submit && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          {errors.submit}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? "Loading..." : submitLabel}
      </button>
    </form>
  );
}
