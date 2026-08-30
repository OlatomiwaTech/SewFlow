import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt.js";

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    businessId: string;
    role: string;
  };
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Authentication required.",
    });
  }

  const token = header.slice("Bearer ".length).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Authentication required.",
    });
  }

  try {
    const payload = verifyAccessToken(token);

    (req as AuthenticatedRequest).user = {
      id: payload.userId,
      businessId: payload.businessId,
      role: payload.role,
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired authentication token.",
    });
  }
}