import type {
  CreateCustomerInput,
  Customer,
  CustomerListResponse,
  UpdateCustomerInput,
} from "@/types/customer";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function formatUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanBase.endsWith("/api") && cleanPath.startsWith("/api/")) {
    return `${cleanBase}${cleanPath.slice(4)}`;
  }
  if (!cleanBase.endsWith("/api") && !cleanPath.startsWith("/api/")) {
    return `${cleanBase}/api${cleanPath}`;
  }
  return `${cleanBase}${cleanPath}`;
}

// Utility function for general API requests
export async function api<T>(
  path: string,
  options: { token?: string; method?: string; body?: string } & RequestInit = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;
  const url = formatUrl(API_BASE_URL, path);
  
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
  
  if (response.status === 204) {
    return null as T;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "An error occurred");
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
    const url = formatUrl(this.baseUrl, endpoint);
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

    if (response.status === 204) {
      return null as T;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || "An error occurred");
    }

    return response.json();
  }

  // Customer API endpoints
  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    const res = await this.request<{ success: boolean; data: Customer }>("/customers", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return res.data;
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
    return this.request<CustomerListResponse>(`/customers?${params}`);
  }

  async getCustomer(id: string): Promise<Customer> {
    const res = await this.request<{ success: boolean; data: Customer }>(`/customers/${id}`);
    return res.data;
  }

  async updateCustomer(
    id: string,
    input: UpdateCustomerInput,
  ): Promise<Customer> {
    const res = await this.request<{ success: boolean; data: Customer }>(`/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return res.data;
  }

  async deleteCustomer(id: string): Promise<void> {
    await this.request<void>(`/customers/${id}`, {
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
