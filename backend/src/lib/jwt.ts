import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { UserRole } from "../types/express.js";

export interface AuthTokenPayload {
  userId: string;
  email: string;
  businessId: string;
  role: UserRole;
}

export function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "1d",
  });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
}