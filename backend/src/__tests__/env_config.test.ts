import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

const postgresUrl = z.string().refine((value) => {
  try {
    const url = new URL(value);
    return (url.protocol === "postgresql:" || url.protocol === "postgres:") && Boolean(url.hostname);
  } catch {
    return false;
  }
});

const originUrl = z.string().url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  DATABASE_URL: postgresUrl,
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().regex(/^\d+\s*(s|m|h|d|w|y)$/),
  CORS_ORIGIN: z.preprocess(
    (value) => typeof value === "string" ? value.split(",").map((origin) => origin.trim()).filter(Boolean) : value,
    z.array(originUrl).min(1),
  ),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]),
});

const validEnvironment = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://produser:prodpass@db.sewflow.internal:5432/sewflow_prod",
  JWT_SECRET: "a-secure-production-jwt-secret-key-minimum-32-chars",
  JWT_EXPIRES_IN: "15m",
  CORS_ORIGIN: "https://sewflow.com,https://admin.sewflow.com",
  LOG_LEVEL: "info",
};

describe("environment configuration schema", () => {
  test("rejects missing and malformed required values", () => {
    assert.equal(envSchema.safeParse({ ...validEnvironment, DATABASE_URL: "not-postgres" }).success, false);
    assert.equal(envSchema.safeParse({ ...validEnvironment, JWT_SECRET: "too-short" }).success, false);
    assert.equal(envSchema.safeParse({ ...validEnvironment, JWT_EXPIRES_IN: "tomorrow" }).success, false);
    assert.equal(envSchema.safeParse({ ...validEnvironment, CORS_ORIGIN: "ftp://invalid.test" }).success, false);
    assert.equal(envSchema.safeParse({ ...validEnvironment, LOG_LEVEL: "verbose" }).success, false);
    assert.equal(envSchema.safeParse({ ...validEnvironment, NODE_ENV: "staging" }).success, false);
  });

  test("accepts valid values and defaults PORT to 5000", () => {
    const result = envSchema.safeParse(validEnvironment);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.PORT, 5000);
      assert.deepEqual(result.data.CORS_ORIGIN, ["https://sewflow.com", "https://admin.sewflow.com"]);
    }
  });
});
