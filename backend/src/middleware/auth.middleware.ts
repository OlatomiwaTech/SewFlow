import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import type { AuthenticatedUser, UserRole } from "../types/express.js";

export type { AuthenticatedUser, UserRole } from "../types/express.js";

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "Authentication required.",
    });
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  if (!token) {
    res.status(401).json({
      success: false,
      error: "Authentication required.",
    });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const user: AuthenticatedUser = {
      id: payload.userId,
      email: payload.email,
      businessId: payload.businessId,
      role: payload.role,
    };

    req.user = user;
    req.tenantId = user.businessId;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: "Invalid or expired authentication token.",
    });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: "Insufficient permissions for this action.",
      });
      return;
    }

    next();
  };
}

export function requireTenantContext(req: Request, res: Response, next: NextFunction): void {
  const tenantId = req.user?.businessId ?? req.tenantId;

  if (!tenantId || typeof tenantId !== "string") {
    res.status(401).json({
      success: false,
      error: "Authenticated tenant context is required.",
    });
    return;
  }

  req.tenantId = tenantId;
  req.user = {
    ...(req.user ?? {
      id: "",
      email: "",
      businessId: tenantId,
      role: "STAFF",
    }),
    businessId: tenantId,
  };

  next();
}