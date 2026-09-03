import { Router } from "express";
import {
  createOrder,
  deleteOrder,
  getOrder,
  getProductionMetrics,
  listAllOrders,
  listOrders,
  updateOrder,
} from "../controllers/order.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

// Router for /api/customers/:customerId/orders
export const customerOrderRouter = Router({ mergeParams: true });
customerOrderRouter.use(requireAuth);
customerOrderRouter.get("/:customerId/orders", listOrders);
customerOrderRouter.post("/:customerId/orders", createOrder);
customerOrderRouter.get("/:customerId/orders/:orderId", getOrder);
customerOrderRouter.patch("/:customerId/orders/:orderId", updateOrder);
customerOrderRouter.delete("/:customerId/orders/:orderId", deleteOrder);

// Router for /api/orders (global workflow & metrics)
export const globalOrderRouter = Router();
globalOrderRouter.use(requireAuth);
globalOrderRouter.get("/metrics", getProductionMetrics);
globalOrderRouter.get("/", listAllOrders);

export default customerOrderRouter;
