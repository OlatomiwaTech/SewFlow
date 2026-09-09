import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { requestContext, type RequestContext } from "../lib/requestContext.js";

export function requestTracing(req: Request, _res: Response, next: NextFunction): void {
  const context: RequestContext = {
    reqId: randomUUID(),
    ipAddress: req.ip,
  };

  requestContext.run(context, next);
}

export function setAuthenticatedContext(tenantId: string, userId: string): void {
  const context = requestContext.getStore();
  if (context) {
    context.tenantId = tenantId;
    context.userId = userId;
  }
}