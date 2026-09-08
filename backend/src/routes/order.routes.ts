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
import { validateRequest } from "../middleware/validateRequest.js";
import {
  createOrderSchema,
  orderParamsSchema,
  orderQuerySchema,
  updateOrderSchema,
} from "../validators/order.validator.js";
import { customerParamsSchema } from "../validators/measurement.validator.js";

// Router for /api/customers/:customerId/orders
export const customerOrderRouter = Router({ mergeParams: true });
customerOrderRouter.use(requireAuth);
customerOrderRouter.get("/:customerId/orders", validateRequest({ params: customerParamsSchema }), listOrders);
customerOrderRouter.post("/:customerId/orders", validateRequest({ params: customerParamsSchema, body: createOrderSchema }), createOrder);
customerOrderRouter.get("/:customerId/orders/:orderId", validateRequest({ params: orderParamsSchema }), getOrder);
customerOrderRouter.patch("/:customerId/orders/:orderId", validateRequest({ params: orderParamsSchema, body: updateOrderSchema }), updateOrder);
customerOrderRouter.delete("/:customerId/orders/:orderId", validateRequest({ params: orderParamsSchema }), deleteOrder);

// Router for /api/orders (global workflow & metrics)
export const globalOrderRouter = Router();
globalOrderRouter.use(requireAuth);
globalOrderRouter.get("/metrics", getProductionMetrics);
globalOrderRouter.get("/", validateRequest({ query: orderQuerySchema }), listAllOrders);

export default customerOrderRouter;
