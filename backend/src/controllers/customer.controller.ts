import type { NextFunction, Request, Response } from "express";
import * as customerService from "../services/customer.service.js";

import {
  createCustomerSchema,
  customerIdSchema,
  customerListQuerySchema,
  updateCustomerSchema,
} from "../validators/customer.validator.js";

function requireBusinessId(req: Request) {
  if (!req.user?.businessId) {
    const error = new Error("Authenticated business context is missing.");
    error.name = "UNAUTHORIZED";
    throw error;
  }

  return req.user.businessId;
}

export async function createCustomer(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const input = createCustomerSchema.parse(req.body);

    const customer = await customerService.createCustomer(
      businessId,
      input,
    );

    return res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    return next(error);
  }
}

export async function listCustomers(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const query = customerListQuerySchema.parse(req.query);

    const result = await customerService.listCustomers(
      businessId,
      query,
    );

    return res.status(200).json({
      success: true,
      data: result.customers,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCustomer(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { id } = customerIdSchema.parse(req.params);

    const customer = await customerService.getCustomer(
      businessId,
      id,
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateCustomer(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { id } = customerIdSchema.parse(req.params);
    const input = updateCustomerSchema.parse(req.body);

    const customer = await customerService.updateCustomer(
      businessId,
      id,
      input,
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteCustomer(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { id } = customerIdSchema.parse(req.params);

    const customer = await customerService.deleteCustomer(
      businessId,
      id,
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found.",
      });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
