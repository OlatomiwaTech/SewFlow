import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { redisClient } from "../lib/redis.js";

export function getHealth(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    service: "sewflow-api",
    status: "alive",
  });
}

export async function getReadiness(_req: Request, res: Response): Promise<void> {
  const checks = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    redisClient?.isReady ? redisClient.ping() : Promise.resolve("disabled"),
  ]);
  const databaseReady = checks[0].status === "fulfilled";
  const redisReady = checks[1].status === "fulfilled";
  const ready = databaseReady && redisReady;

  res.status(ready ? 200 : 503).json({
    success: ready,
    service: "sewflow-api",
    status: ready ? "ready" : "not_ready",
    checks: {
      database: databaseReady ? "up" : "down",
      redis: redisReady ? "up" : "down",
    },
  });
}
