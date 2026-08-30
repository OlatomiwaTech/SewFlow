import type {
  CreateCustomerInput,
  Customer,
  CustomerListResponse,
  UpdateCustomerInput,
} from "@/types/customer";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// Utility function for general API requests
export async function api<T>(
  path: string,
  options: { token?: string; method?: string; body?: string } & RequestInit = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${path}`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "An error occurred");
  }
  
  return response.json() as Promise<T>;
}

// ApiClient class for typed customer operations
class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
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
  ): Promise<CustomerListResponse> {
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