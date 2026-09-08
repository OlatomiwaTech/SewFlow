import { Router } from "express";
import {
  adjustStock,
  createMaterial,
  deleteMaterial,
  getInventorySummary,
  getMaterial,
  listMaterials,
  updateMaterial,
} from "../controllers/inventory.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  adjustStockSchema,
  createMaterialSchema,
  materialParamsSchema,
  materialQuerySchema,
  updateMaterialSchema,
} from "../validators/inventory.validator.js";

const router = Router();

router.use(requireAuth);

router.get("/summary", getInventorySummary);
router.get("/", validateRequest({ query: materialQuerySchema }), listMaterials);
router.post("/", validateRequest({ body: createMaterialSchema }), createMaterial);
router.get("/:id", validateRequest({ params: materialParamsSchema }), getMaterial);
router.patch("/:id", validateRequest({ params: materialParamsSchema, body: updateMaterialSchema }), updateMaterial);
router.post("/:id/stock", validateRequest({ params: materialParamsSchema, body: adjustStockSchema }), adjustStock);
router.delete("/:id", validateRequest({ params: materialParamsSchema }), deleteMaterial);

export default router;
