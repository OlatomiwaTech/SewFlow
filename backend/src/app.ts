import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import healthRoutes from "./routes/health.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import measurementRoutes from "./routes/measurement.routes.js";
import { customerOrderRouter, globalOrderRouter } from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { env } from "./config/env.js";

const app = express();

const allowedOrigins = Array.from(
  new Set(
    [
      env.FRONTEND_URL,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ].flatMap((url) => (url ? url.split(",").map((s) => s.trim().replace(/\/+$/, "")) : []))
  )
);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const cleanOrigin = origin.replace(/\/+$/, "");
      if (allowedOrigins.includes(cleanOrigin) || process.env.NODE_ENV !== "production") {
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
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/customers", measurementRoutes);
app.use("/api/customers", customerOrderRouter);
app.use("/api/orders", globalOrderRouter);
app.use("/api/customers", paymentRoutes);
app.use("/api/materials", inventoryRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
