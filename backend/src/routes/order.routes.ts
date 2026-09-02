import { Router } from "express";
import {
  createOrder,
  deleteOrder,
  getOrder,
  listOrders,
  updateOrder,
} from "../controllers/order.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get("/:customerId/orders", listOrders);
router.post("/:customerId/orders", createOrder);
router.get("/:customerId/orders/:orderId", getOrder);
router.patch("/:customerId/orders/:orderId", updateOrder);
router.delete("/:customerId/orders/:orderId", deleteOrder);

export default router;
