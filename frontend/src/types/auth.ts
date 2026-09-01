export interface AuthUser {
  id: string;
  businessId: string;
  name: string;
  email: string;
  role: "OWNER" | "STAFF";
  isActive: boolean;
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
  currency: string;
  timezone: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  businessName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  business: Business;
}

export interface MeResponse {
  user: AuthUser;
  business: Business;
}
