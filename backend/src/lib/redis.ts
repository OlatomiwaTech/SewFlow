import { createClient } from "redis";
import { env } from "../config/env.js";

export const redisClient = env.REDIS_URL
  ? createClient({ url: env.REDIS_URL })
  : null;

export async function connectRedis(): Promise<void> {
  if (redisClient && !redisClient.isOpen) {
    await redisClient.connect();
  }
}