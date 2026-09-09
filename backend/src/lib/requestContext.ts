import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
  reqId: string;
  ipAddress: string;
  tenantId?: string;
  userId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return requestContext.getStore();
}