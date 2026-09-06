import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

describe("Production Environment Variable Security Audit", () => {
  const getEnvSchema = (currentEnv: string) =>
    z.object({
      NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
      PORT: z.coerce.number().int().positive().default(4000),
      DATABASE_URL: z
        .string()
        .min(1, "DATABASE_URL is required")
        .refine(
          (url) => {
            if (currentEnv === "production") {
              return !url.includes("localhost") && !url.includes("127.0.0.1");
            }
            return true;
          },
          { message: "Production DATABASE_URL must not point to localhost or 127.0.0.1" },
        ),
      JWT_SECRET: z
        .string()
        .min(32, "JWT_SECRET must be at least 32 characters")
        .refine(
          (secret) => {
            if (currentEnv === "production") {
              return (
                secret !== "replace-with-a-32-character-secret-key-min" &&
                secret !== "test-jwt-secret-key-32-characters-minimum-length" &&
                secret !== "your-secret"
              );
            }
            return true;
          },
          { message: "Production JWT_SECRET must not use a development or test fallback key" },
        ),
      FRONTEND_URL: z.string().default("http://localhost:3000"),
    });

  test("production fails if DATABASE_URL is missing or points to localhost", () => {
    const schema = getEnvSchema("production");

    // Missing DATABASE_URL
    const res1 = schema.safeParse({
      NODE_ENV: "production",
      JWT_SECRET: "a-valid-production-secret-key-with-over-32-chars",
    });
    assert.equal(res1.success, false);

    // Localhost DATABASE_URL in production
    const res2 = schema.safeParse({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/sewflow",
      JWT_SECRET: "a-valid-production-secret-key-with-over-32-chars",
    });
    assert.equal(res2.success, false);
  });

  test("production fails if JWT_SECRET is missing or uses test fallback key", () => {
    const schema = getEnvSchema("production");

    // Missing JWT_SECRET
    const res1 = schema.safeParse({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://produser:prodpass@db.sewflow.internal:5432/sewflow_prod",
    });
    assert.equal(res1.success, false);

    // Test fallback key in production
    const res2 = schema.safeParse({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://produser:prodpass@db.sewflow.internal:5432/sewflow_prod",
      JWT_SECRET: "test-jwt-secret-key-32-characters-minimum-length",
    });
    assert.equal(res2.success, false);
  });

  test("production succeeds with valid production DATABASE_URL and secret key", () => {
    const schema = getEnvSchema("production");

    const res = schema.safeParse({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://produser:prodpass@db.sewflow.internal:5432/sewflow_prod",
      JWT_SECRET: "a-secure-production-jwt-secret-key-minimum-32-chars",
      FRONTEND_URL: "https://sewflow.com",
    });

    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.NODE_ENV, "production");
      assert.equal(res.data.FRONTEND_URL, "https://sewflow.com");
    }
  });
});
