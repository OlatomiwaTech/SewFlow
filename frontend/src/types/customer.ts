export interface Customer {
  id: string;
  businessId: string;
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface CustomerQuery {
  search?: string;
  page: number;
  limit: number;
}

export interface PaginatedCustomers {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerListResponse {
  success: boolean;
  data: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}