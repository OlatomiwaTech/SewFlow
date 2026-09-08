export type UserRole = "OWNER" | "ADMIN" | "TAILOR" | "STAFF";

export interface AuthenticatedUser {
  id: string;
  email: string;
  businessId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      tenantId?: string;
    }
  }
}

export {};