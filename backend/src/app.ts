import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import customerRoutes from "./routes/customer.routes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use("/api/customers", customerRoutes);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined"));
}

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "sewflow-api",
    status: "healthy",
  });
});

app.use("/api/auth", authRoutes);

app.use(errorHandler);

export default app;