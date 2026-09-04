import type { NextFunction, Request, Response } from "express";
import * as orderMaterialService from "../services/order-material.service.js";
import {
  addPlannedMaterialSchema,
  orderMaterialItemParamsSchema,
  orderMaterialNestedParamsSchema,
  recordActualConsumptionSchema,
  updateOrderMaterialSchema,
} from "../validators/order-material.validator.js";

function requireBusinessId(req: Request) {
  if (!req.user?.businessId) {
    const error = new Error("Authenticated business context is missing.");
    error.name = "UNAUTHORIZED";
    throw error;
  }
  return req.user.businessId;
}

export async function listOrderMaterials(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { customerId, orderId } = orderMaterialNestedParamsSchema.parse(req.params);

    const materials = await orderMaterialService.listOrderMaterials(
      businessId,
      customerId,
      orderId,
    );

    return res.status(200).json({
      success: true,
      data: materials,
    });
  } catch (error) {
    return next(error);
  }
}

export async function addPlannedMaterial(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { customerId, orderId } = orderMaterialNestedParamsSchema.parse(req.params);
    const input = addPlannedMaterialSchema.parse(req.body);

    const result = await orderMaterialService.addPlannedMaterial(
      businessId,
      customerId,
      orderId,
      input,
    );

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateOrderMaterial(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { customerId, orderId, orderMaterialId } = orderMaterialItemParamsSchema.parse(req.params);
    const input = updateOrderMaterialSchema.parse(req.body);

    const result = await orderMaterialService.updateOrderMaterial(
      businessId,
      customerId,
      orderId,
      orderMaterialId,
      input,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

export async function recordActualConsumption(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { customerId, orderId, orderMaterialId } = orderMaterialItemParamsSchema.parse(req.params);
    const input = recordActualConsumptionSchema.parse(req.body);
    const userId = req.user?.id;

    const result = await orderMaterialService.recordActualConsumption(
      businessId,
      customerId,
      orderId,
      orderMaterialId,
      input,
      userId,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteOrderMaterial(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { customerId, orderId, orderMaterialId } = orderMaterialItemParamsSchema.parse(req.params);
    const userId = req.user?.id;

    await orderMaterialService.deleteOrderMaterial(
      businessId,
      customerId,
      orderId,
      orderMaterialId,
      userId,
    );

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
