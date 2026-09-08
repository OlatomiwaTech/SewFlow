import "dotenv/config";
import pino from "pino";
import { z } from "zod";

const startupLogger = pino({ level: "error" });

const postgresUrl = z.string().refine(
  (value) => {
    try {
      const url = new URL(value);
      return (url.protocol === "postgresql:" || url.protocol === "postgres:") && Boolean(url.hostname);
    } catch {
      return false;
    }
  },
  "DATABASE_URL must be a valid PostgreSQL connection string",
);

const originUrl = z.string().url().refine(
  (value) => {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  },
  "CORS_ORIGIN must contain HTTP(S) origins",
);

const redisUrl = z.string().url().refine(
  (value) => ["redis:", "rediss:"].includes(new URL(value).protocol),
  "REDIS_URL must be a redis:// or rediss:// connection string",
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  DATABASE_URL: postgresUrl,
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().regex(/^\d+\s*(s|m|h|d|w|y)$/, "JWT_EXPIRES_IN must use a duration such as 15m or 1d"),
  CORS_ORIGIN: z.preprocess(
    (value) => typeof value === "string" ? value.split(",").map((origin) => origin.trim()).filter(Boolean) : value,
    z.array(originUrl).min(1, "CORS_ORIGIN must contain at least one origin"),
  ),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]),
  REDIS_URL: redisUrl.optional(),
}).superRefine((values, context) => {
  if (values.NODE_ENV === "production" && !values.REDIS_URL) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["REDIS_URL"],
      message: "REDIS_URL is required in production",
    });
  }
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  startupLogger.error(
    { issues: result.error.issues.map(({ path, message }) => ({ path, message })) },
    "Invalid environment configuration",
  );
  process.exit(1);
}

export const env = result.data;
