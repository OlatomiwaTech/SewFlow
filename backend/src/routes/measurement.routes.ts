import { Router } from "express";
import {
  createMeasurement,
  deleteMeasurement,
  getMeasurement,
  listMeasurements,
  updateMeasurement,
} from "../controllers/measurement.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get("/:customerId/measurements", listMeasurements);
router.post("/:customerId/measurements", createMeasurement);
router.get("/:customerId/measurements/:measurementId", getMeasurement);
router.patch("/:customerId/measurements/:measurementId", updateMeasurement);
router.delete("/:customerId/measurements/:measurementId", deleteMeasurement);

export default router;
