import type { NextFunction, Request, Response } from "express";
import * as orderService from "../services/order.service.js";
import { customerParamsSchema } from "../validators/measurement.validator.js";
import {
  createOrderSchema,
  orderParamsSchema,
  orderQuerySchema,
  updateOrderSchema,
} from "../validators/order.validator.js";

function requireBusinessId(req: Request) {
  if (!req.user?.businessId) {
    const error = new Error("Authenticated business context is missing.");
    error.name = "UNAUTHORIZED";
    throw error;
  }
  return req.user.businessId;
}

export async function listAllOrders(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const query = orderQuerySchema.parse(req.query);

    const orders = await orderService.listAllOrders(businessId, query);

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getProductionMetrics(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);

    const metrics = await orderService.getProductionMetrics(businessId);

    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    return next(error);
  }
}

export async function listOrders(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { customerId } = customerParamsSchema.parse(req.params);

    const orders = await orderService.listOrders(businessId, customerId);

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getOrder(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { customerId, orderId } = orderParamsSchema.parse(req.params);

    const order = await orderService.getOrder(
      businessId,
      customerId,
      orderId,
    );

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createOrder(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { customerId } = customerParamsSchema.parse(req.params);
    const input = createOrderSchema.parse(req.body);

    const order = await orderService.createOrder(
      businessId,
      customerId,
      input,
    );

    return res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateOrder(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { customerId, orderId } = orderParamsSchema.parse(req.params);
    const input = updateOrderSchema.parse(req.body);

    const order = await orderService.updateOrder(
      businessId,
      customerId,
      orderId,
      input,
    );

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteOrder(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { customerId, orderId } = orderParamsSchema.parse(req.params);

    await orderService.deleteOrder(businessId, customerId, orderId);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
