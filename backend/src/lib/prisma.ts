import { PrismaClient } from "@prisma/client";
import { createAuditExtension } from "./db/auditExtension.js";



declare global {
  
  var prisma: PrismaClient | undefined;
}

const basePrisma = (
  globalThis.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  })
) as PrismaClient;

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = basePrisma;
}

const prisma = basePrisma.$extends(createAuditExtension(basePrisma));

export default prisma;