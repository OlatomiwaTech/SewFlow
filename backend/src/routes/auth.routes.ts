import { Router } from "express";
import {
  login,
  me,
  register,
  refresh,
  revokeSessions,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";

const router = Router();

router.post("/register", validateRequest({ body: registerSchema }), register);
router.post("/login", validateRequest({ body: loginSchema }), login);
router.post("/refresh", refresh);
router.get("/me", requireAuth, me);
router.delete("/sessions", requireAuth, revokeSessions);

export default router;