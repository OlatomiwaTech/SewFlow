import { Router } from "express";
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from "../controllers/customer.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  createCustomerSchema,
  customerIdSchema,
  customerListQuerySchema,
  updateCustomerSchema,
} from "../validators/customer.validator.js";

const router = Router();

router.use(requireAuth);

router.get("/", validateRequest({ query: customerListQuerySchema }), listCustomers);
router.post("/", validateRequest({ body: createCustomerSchema }), createCustomer);
router.get("/:id", validateRequest({ params: customerIdSchema }), getCustomer);
router.patch("/:id", validateRequest({ params: customerIdSchema, body: updateCustomerSchema }), updateCustomer);
router.delete("/:id", validateRequest({ params: customerIdSchema }), deleteCustomer);

export default router;