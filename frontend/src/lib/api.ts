import type {
  CreateCustomerInput,
  Customer,
  PaginatedCustomers,
  UpdateCustomerInput,
} from "@/types/customer";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "An error occurred");
    }

    return response.json();
  }

  // Customer API endpoints
  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    return this.request("/customers", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async listCustomers(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<PaginatedCustomers> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });
    return this.request(`/customers?${params}`);
  }

  async getCustomer(id: string): Promise<Customer> {
    return this.request(`/customers/${id}`);
  }

  async updateCustomer(
    id: string,
    input: UpdateCustomerInput,
  ): Promise<Customer> {
    return this.request(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    return this.request(`/customers/${id}`, {
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
