import { PrismaClient } from "@prisma/client";



declare global {
  
  var prisma: PrismaClient | undefined;
}

const prisma: PrismaClient = (
  globalThis.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  })
) as PrismaClient;

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;