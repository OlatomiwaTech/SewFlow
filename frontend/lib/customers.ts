import { api } from "./api";
import type {
  Customer,
  CustomerListResponse,
} from "../types/customer";

export interface CreateCustomerInput {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface UpdateCustomerInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export async function getCustomers(
  token: string,
  params?: {
    search?: string;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();

  if (params?.search) {
    query.set("search", params.search);
  }

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  const suffix = query.toString()
    ? `?${query.toString()}`
    : "";

  return api<CustomerListResponse>(`/customers${suffix}`, {
    token,
  });
}

export async function getCustomer(
  token: string,
  id: string,
) {
  return api<Customer>(`/customers/${id}`, {
    token,
  });
}

export async function createCustomer(
  token: string,
  customer: CreateCustomerInput,
) {
  return api<Customer>("/customers", {
    token,
    method: "POST",
    body: JSON.stringify(customer),
  });
}

export async function updateCustomer(
  token: string,
  id: string,
  customer: UpdateCustomerInput,
) {
  return api<Customer>(`/customers/${id}`, {
    token,
    method: "PUT",
    body: JSON.stringify(customer),
  });
}

export async function deleteCustomer(
  token: string,
  id: string,
) {
  return api<void>(`/customers/${id}`, {
    token,
    method: "DELETE",
  });
}
