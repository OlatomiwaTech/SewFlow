import app from "./app.js";
import { env } from "./config/env.js";
import prisma from "./lib/prisma.js";
import logger from "./lib/logger.js";
import { connectRedis, redisClient } from "./lib/redis.js";

let server: ReturnType<typeof app.listen> | undefined;
let shutdownPromise: Promise<void> | undefined;
const shutdownTimeoutMs = 10_000;

async function start() {
  await prisma.$connect();
  await connectRedis();
  server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "SewFlow API started");
  });
}

async function shutdown(signal: string) {
  if (shutdownPromise) return shutdownPromise;

  shutdownPromise = (async () => {
    logger.info({ signal }, "Shutdown requested");
    const forceExitTimer = setTimeout(() => {
      logger.error("Graceful shutdown timed out");
      process.exit(1);
    }, shutdownTimeoutMs);
    forceExitTimer.unref();

    try {
      if (server) {
        server.closeIdleConnections?.();
        await new Promise<void>((resolve, reject) => {
          server?.close((error) => (error ? reject(error) : resolve()));
        });
      }

      await Promise.allSettled([
        prisma.$disconnect(),
        redisClient?.isOpen ? redisClient.disconnect() : Promise.resolve(),
      ]);
      logger.info("SewFlow API stopped");
      process.exitCode = 0;
    } finally {
      clearTimeout(forceExitTimer);
    }
  })();

  return shutdownPromise;
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