import "dotenv/config";
import { z } from "zod";

const isTestEnv =
  process.env.NODE_ENV === "test" ||
  process.argv.some((arg) => arg.includes("--test")) ||
  process.env.npm_lifecycle_event === "test";

if (isTestEnv) {
  process.env.NODE_ENV = "test";
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL =
      "postgresql://user:pass@localhost:5432/sewflow?schema=public";
  }
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET =
      "test-jwt-secret-key-32-characters-minimum-length";
  }
}

const currentEnv = process.env.NODE_ENV || "development";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

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

  FRONTEND_URL: z
    .string()
    .default("http://localhost:3000"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration:");

  for (const issue of result.error.issues) {
    console.error(`- ${issue.path.join(".")}: ${issue.message}`);
  }

  process.exit(1);
}

export const env = result.data;
