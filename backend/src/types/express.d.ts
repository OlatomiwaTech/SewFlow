import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedRequest["user"];
    }
  }
}

export {};