import type {
  CreateCustomerInput,
  Customer,
  CustomerListResponse,
  UpdateCustomerInput,
} from "@/types/customer";
import type {
  AuthResponse,
  LoginInput,
  MeResponse,
  RegisterInput,
} from "@/types/auth";
import type {
  CreateMeasurementInput,
  Measurement,
  UpdateMeasurementInput,
} from "@/types/measurement";
import type {
  CreateOrderInput,
  Order,
  ProductionMetrics,
  UpdateOrderInput,
} from "@/types/order";
import type {
  CreatePaymentInput,
  Payment,
  UpdatePaymentInput,
} from "@/types/payment";
import type {
  AdjustStockInput,
  CreateMaterialInput,
  InventorySummary,
  Material,
  UpdateMaterialInput,
} from "@/types/inventory";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? "/api" : "http://localhost:4000/api");

function formatUrl(baseUrl: string, path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (cleanBase === "/api" || cleanBase.endsWith("/api")) {
    if (cleanPath === "/api") return cleanBase;
    if (cleanPath.startsWith("/api/")) return `${cleanBase}${cleanPath.slice(4)}`;
    return `${cleanBase}${cleanPath}`;
  }

  if (cleanPath === "/api" || cleanPath.startsWith("/api/")) {
    return `${cleanBase}${cleanPath}`;
  }

  return cleanBase ? `${cleanBase}/api${cleanPath}` : `/api${cleanPath}`;
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
  
  const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  
  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
    });
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message.includes("Failed to fetch") ||
        err.message.includes("fetch failed") ||
        err.name === "TypeError")
    ) {
      throw new Error(
        "Failed to fetch: Unable to connect to the server. Please check your network connection or API URL configuration."
      );
    }
    throw err instanceof Error
      ? err
      : new Error("Failed to fetch: Unable to connect to the server.");
  }
  
  if (response.status === 204) {
    return null as T;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error ||
        errorData.message ||
        `Server error (${response.status}${response.statusText ? `: ${response.statusText}` : ""})`
    );
  }
  
  return response.json() as Promise<T>;
}

// ApiClient class for typed operations
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
      ...(options.headers as Record<string, string>),
    };

    if (token && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes("Failed to fetch") ||
          err.message.includes("fetch failed") ||
          err.name === "TypeError")
      ) {
        throw new Error(
          "Failed to fetch: Unable to connect to the server. Please check your network connection or API URL configuration."
        );
      }
      throw err instanceof Error
        ? err
        : new Error("Failed to fetch: Unable to connect to the server.");
    }

    if (response.status === 204) {
      return null as T;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          errorData.message ||
          `Server error (${response.status}${response.statusText ? `: ${response.statusText}` : ""})`
      );
    }

    return response.json();
  }

  // Auth API endpoints
  async login(input: LoginInput): Promise<AuthResponse> {
    const res = await this.request<{ success: boolean; data: AuthResponse }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return res.data;
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    const res = await this.request<{ success: boolean; data: AuthResponse }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return res.data;
  }

  async getCurrentUser(): Promise<MeResponse> {
    const res = await this.request<{ success: boolean; data: MeResponse }>("/auth/me");
    return res.data;
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

  // Measurement API endpoints
  async listMeasurements(customerId: string): Promise<Measurement[]> {
    const res = await this.request<{ success: boolean; data: Measurement[] }>(
      `/customers/${customerId}/measurements`,
    );
    return res.data;
  }

  async getMeasurement(
    customerId: string,
    measurementId: string,
  ): Promise<Measurement> {
    const res = await this.request<{ success: boolean; data: Measurement }>(
      `/customers/${customerId}/measurements/${measurementId}`,
    );
    return res.data;
  }

  async createMeasurement(
    customerId: string,
    input: CreateMeasurementInput,
  ): Promise<Measurement> {
    const res = await this.request<{ success: boolean; data: Measurement }>(
      `/customers/${customerId}/measurements`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
    return res.data;
  }

  async updateMeasurement(
    customerId: string,
    measurementId: string,
    input: UpdateMeasurementInput,
  ): Promise<Measurement> {
    const res = await this.request<{ success: boolean; data: Measurement }>(
      `/customers/${customerId}/measurements/${measurementId}`,
      {
        method: "PATCH",
        body: JSON.stringify(input),
      },
    );
    return res.data;
  }

  async deleteMeasurement(
    customerId: string,
    measurementId: string,
  ): Promise<void> {
    await this.request<void>(
      `/customers/${customerId}/measurements/${measurementId}`,
      {
        method: "DELETE",
      },
    );
  }

  // Order API endpoints
  async listAllOrders(query?: {
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<Order[]> {
    const params = new URLSearchParams();
    if (query?.status) params.append("status", query.status);
    if (query?.priority) params.append("priority", query.priority);
    if (query?.search) params.append("search", query.search);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await this.request<{ success: boolean; data: Order[] }>(
      `/orders${queryString}`,
    );
    return res.data;
  }

  async getProductionMetrics(): Promise<ProductionMetrics> {
    const res = await this.request<{ success: boolean; data: ProductionMetrics }>(
      "/orders/metrics",
    );
    return res.data;
  }

  async listOrders(customerId: string): Promise<Order[]> {
    const res = await this.request<{ success: boolean; data: Order[] }>(
      `/customers/${customerId}/orders`,
    );
    return res.data;
  }

  async getOrder(customerId: string, orderId: string): Promise<Order> {
    const res = await this.request<{ success: boolean; data: Order }>(
      `/customers/${customerId}/orders/${orderId}`,
    );
    return res.data;
  }

  async createOrder(
    customerId: string,
    input: CreateOrderInput,
  ): Promise<Order> {
    const res = await this.request<{ success: boolean; data: Order }>(
      `/customers/${customerId}/orders`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
    return res.data;
  }

  async updateOrder(
    customerId: string,
    orderId: string,
    input: UpdateOrderInput,
  ): Promise<Order> {
    const res = await this.request<{ success: boolean; data: Order }>(
      `/customers/${customerId}/orders/${orderId}`,
      {
        method: "PATCH",
        body: JSON.stringify(input),
      },
    );
    return res.data;
  }

  async deleteOrder(customerId: string, orderId: string): Promise<void> {
    await this.request<void>(`/customers/${customerId}/orders/${orderId}`, {
      method: "DELETE",
    });
  }

  // Payment API endpoints
  async listPayments(customerId: string, orderId: string): Promise<Payment[]> {
    const res = await this.request<{ success: boolean; data: Payment[] }>(
      `/customers/${customerId}/orders/${orderId}/payments`,
    );
    return res.data;
  }

  async getPayment(
    customerId: string,
    orderId: string,
    paymentId: string,
  ): Promise<Payment> {
    const res = await this.request<{ success: boolean; data: Payment }>(
      `/customers/${customerId}/orders/${orderId}/payments/${paymentId}`,
    );
    return res.data;
  }

  async createPayment(
    customerId: string,
    orderId: string,
    input: CreatePaymentInput,
  ): Promise<Payment> {
    const res = await this.request<{ success: boolean; data: Payment }>(
      `/customers/${customerId}/orders/${orderId}/payments`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
    return res.data;
  }

  async updatePayment(
    customerId: string,
    orderId: string,
    paymentId: string,
    input: UpdatePaymentInput,
  ): Promise<Payment> {
    const res = await this.request<{ success: boolean; data: Payment }>(
      `/customers/${customerId}/orders/${orderId}/payments/${paymentId}`,
      {
        method: "PATCH",
        body: JSON.stringify(input),
      },
    );
    return res.data;
  }

  async deletePayment(
    customerId: string,
    orderId: string,
    paymentId: string,
  ): Promise<void> {
    await this.request<void>(
      `/customers/${customerId}/orders/${orderId}/payments/${paymentId}`,
      {
        method: "DELETE",
      },
    );
  }

  // Inventory API endpoints
  async listMaterials(query?: {
    category?: string;
    status?: string;
    search?: string;
  }): Promise<Material[]> {
    const params = new URLSearchParams();
    if (query?.category) params.append("category", query.category);
    if (query?.status) params.append("status", query.status);
    if (query?.search) params.append("search", query.search);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await this.request<{ success: boolean; data: Material[] }>(
      `/materials${queryString}`,
    );
    return res.data;
  }

  async getInventorySummary(): Promise<InventorySummary> {
    const res = await this.request<{ success: boolean; data: InventorySummary }>(
      "/materials/summary",
    );
    return res.data;
  }

  async getMaterial(id: string): Promise<Material> {
    const res = await this.request<{ success: boolean; data: Material }>(
      `/materials/${id}`,
    );
    return res.data;
  }

  async createMaterial(input: CreateMaterialInput): Promise<Material> {
    const res = await this.request<{ success: boolean; data: Material }>(
      "/materials",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
    return res.data;
  }

  async updateMaterial(
    id: string,
    input: UpdateMaterialInput,
  ): Promise<Material> {
    const res = await this.request<{ success: boolean; data: Material }>(
      `/materials/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(input),
      },
    );
    return res.data;
  }

  async adjustStock(id: string, input: AdjustStockInput): Promise<Material> {
    const res = await this.request<{ success: boolean; data: Material }>(
      `/materials/${id}/stock`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
    return res.data;
  }

  async deleteMaterial(id: string): Promise<void> {
    await this.request<void>(`/materials/${id}`, {
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
