import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import healthRoutes from "./routes/health.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import measurementRoutes from "./routes/measurement.routes.js";
import { customerOrderRouter, globalOrderRouter } from "./routes/order.routes.js";
import orderMaterialRoutes from "./routes/order-material.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { env } from "./config/env.js";

const app = express();

const allowedOrigins = new Set(env.CORS_ORIGIN.map((origin) => origin.replace(/\/+$/, "")));

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

app.use(helmet());
app.use(globalRateLimiter);
app.use(
  cors({
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const cleanOrigin = origin.replace(/\/+$/, "");
      if (allowedOrigins.has(cleanOrigin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  }),
);

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined"));
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", healthRoutes);
app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/customers", measurementRoutes);
app.use("/api/customers", customerOrderRouter);
app.use("/api/customers", orderMaterialRoutes);
app.use("/api/orders", globalOrderRouter);
app.use("/api/customers", paymentRoutes);
app.use("/api/materials", inventoryRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
