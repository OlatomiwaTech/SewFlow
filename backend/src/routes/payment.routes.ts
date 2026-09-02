import { Router } from "express";
import {
  createPayment,
  deletePayment,
  getPayment,
  listPayments,
  updatePayment,
} from "../controllers/payment.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get("/:customerId/orders/:orderId/payments", listPayments);
router.post("/:customerId/orders/:orderId/payments", createPayment);
router.get("/:customerId/orders/:orderId/payments/:paymentId", getPayment);
router.patch("/:customerId/orders/:orderId/payments/:paymentId", updatePayment);
router.delete("/:customerId/orders/:orderId/payments/:paymentId", deletePayment);

export default router;
