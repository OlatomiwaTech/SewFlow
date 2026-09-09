import { Router } from 'express';
import { getHealth, getReadiness } from "../controllers/health.controller.js";

const router = Router();

router.get("/health", getHealth);
router.get("/health/live", getHealth);
router.get("/health/ready", getReadiness);

export default router;
