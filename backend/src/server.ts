import app from "./app.js";
import { env } from "./config/env.js";
import prisma from "./lib/prisma.js";
import logger from "./lib/logger.js";
import { connectRedis, redisClient } from "./lib/redis.js";

let server: ReturnType<typeof app.listen> | undefined;

async function start() {
  await connectRedis();
  server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "SewFlow API started");
  });
}

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutdown requested");

  if (!server) {
    await redisClient?.disconnect();
    process.exit(0);
  }

  server.close(async () => {
    await prisma.$disconnect();
    await redisClient?.disconnect();
    logger.info("SewFlow API stopped");
    process.exit(0);
  });
}

void start().catch((error) => {
  logger.fatal({ err: error }, "SewFlow API failed to start");
  process.exit(1);
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});