import { Router } from "express";
import {
  addPlannedMaterial,
  deleteOrderMaterial,
  listOrderMaterials,
  recordActualConsumption,
  updateOrderMaterial,
} from "../controllers/order-material.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  addPlannedMaterialSchema,
  orderMaterialItemParamsSchema,
  orderMaterialNestedParamsSchema,
  recordActualConsumptionSchema,
  updateOrderMaterialSchema,
} from "../validators/order-material.validator.js";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get("/:customerId/orders/:orderId/materials", validateRequest({ params: orderMaterialNestedParamsSchema }), listOrderMaterials);
router.post("/:customerId/orders/:orderId/materials", validateRequest({ params: orderMaterialNestedParamsSchema, body: addPlannedMaterialSchema }), addPlannedMaterial);
router.patch("/:customerId/orders/:orderId/materials/:orderMaterialId", validateRequest({ params: orderMaterialItemParamsSchema, body: updateOrderMaterialSchema }), updateOrderMaterial);
router.post("/:customerId/orders/:orderId/materials/:orderMaterialId/consume", validateRequest({ params: orderMaterialItemParamsSchema, body: recordActualConsumptionSchema }), recordActualConsumption);
router.delete("/:customerId/orders/:orderId/materials/:orderMaterialId", validateRequest({ params: orderMaterialItemParamsSchema }), deleteOrderMaterial);

export default router;
