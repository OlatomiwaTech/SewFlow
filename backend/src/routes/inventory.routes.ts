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

const router = Router();

router.use(requireAuth);

router.get("/summary", getInventorySummary);
router.get("/", listMaterials);
router.post("/", createMaterial);
router.get("/:id", getMaterial);
router.patch("/:id", updateMaterial);
router.post("/:id/stock", adjustStock);
router.delete("/:id", deleteMaterial);

export default router;
