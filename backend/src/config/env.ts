import "dotenv/config";
import { z } from "zod";

if (process.env.NODE_ENV === "test" || !process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ||
    "postgresql://user:pass@localhost:5432/sewflow?schema=public";
}

if (process.env.NODE_ENV === "test" || !process.env.JWT_SECRET) {
  process.env.JWT_SECRET =
    process.env.JWT_SECRET ||
    "test-jwt-secret-key-32-characters-minimum-length";
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required"),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters"),

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
