import { Router } from "express";
import {
  createPayment,
  deletePayment,
  getPayment,
  listPayments,
  updatePayment,
} from "../controllers/payment.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  createPaymentSchema,
  orderNestedParamsSchema,
  paymentParamsSchema,
  updatePaymentSchema,
} from "../validators/payment.validator.js";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get("/:customerId/orders/:orderId/payments", validateRequest({ params: orderNestedParamsSchema }), listPayments);
router.post("/:customerId/orders/:orderId/payments", validateRequest({ params: orderNestedParamsSchema, body: createPaymentSchema }), createPayment);
router.get("/:customerId/orders/:orderId/payments/:paymentId", validateRequest({ params: paymentParamsSchema }), getPayment);
router.patch("/:customerId/orders/:orderId/payments/:paymentId", validateRequest({ params: paymentParamsSchema, body: updatePaymentSchema }), updatePayment);
router.delete("/:customerId/orders/:orderId/payments/:paymentId", validateRequest({ params: paymentParamsSchema }), deletePayment);

export default router;
