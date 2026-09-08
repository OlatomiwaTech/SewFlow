import { Router } from "express";
import {
  createMeasurement,
  deleteMeasurement,
  getMeasurement,
  listMeasurements,
  updateMeasurement,
} from "../controllers/measurement.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  createMeasurementSchema,
  customerParamsSchema,
  measurementParamsSchema,
  updateMeasurementSchema,
} from "../validators/measurement.validator.js";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get("/:customerId/measurements", validateRequest({ params: customerParamsSchema }), listMeasurements);
router.post("/:customerId/measurements", validateRequest({ params: customerParamsSchema, body: createMeasurementSchema }), createMeasurement);
router.get("/:customerId/measurements/:measurementId", validateRequest({ params: measurementParamsSchema }), getMeasurement);
router.patch("/:customerId/measurements/:measurementId", validateRequest({ params: measurementParamsSchema, body: updateMeasurementSchema }), updateMeasurement);
router.delete("/:customerId/measurements/:measurementId", validateRequest({ params: measurementParamsSchema }), deleteMeasurement);

export default router;
