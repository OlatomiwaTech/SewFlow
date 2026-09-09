import pino from "pino";
import { getRequestContext } from "./requestContext.js";

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  mixin() {
    const context = getRequestContext();
    return context
      ? {
          reqId: context.reqId,
          ...(context.tenantId ? { tenantId: context.tenantId } : {}),
          ...(context.userId ? { userId: context.userId } : {}),
        }
      : {};
  },
});

export default logger;
