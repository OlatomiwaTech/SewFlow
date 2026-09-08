import app from "./app.js";
import { env } from "./config/env.js";
import prisma from "./lib/prisma.js";
import logger from "./lib/logger.js";

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "SewFlow API started");
});

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutdown requested");

  server.close(async () => {
    await prisma.$disconnect();
    logger.info("SewFlow API stopped");
    process.exit(0);
  });
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});