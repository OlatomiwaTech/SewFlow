import { Router } from "express";
import {
  addPlannedMaterial,
  deleteOrderMaterial,
  listOrderMaterials,
  recordActualConsumption,
  updateOrderMaterial,
} from "../controllers/order-material.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get("/:customerId/orders/:orderId/materials", listOrderMaterials);
router.post("/:customerId/orders/:orderId/materials", addPlannedMaterial);
router.patch("/:customerId/orders/:orderId/materials/:orderMaterialId", updateOrderMaterial);
router.post("/:customerId/orders/:orderId/materials/:orderMaterialId/consume", recordActualConsumption);
router.delete("/:customerId/orders/:orderId/materials/:orderMaterialId", deleteOrderMaterial);

export default router;
