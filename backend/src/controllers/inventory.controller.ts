import type { NextFunction, Request, Response } from "express";
import * as inventoryService from "../services/inventory.service.js";
import {
  adjustStockSchema,
  createMaterialSchema,
  materialParamsSchema,
  materialQuerySchema,
  updateMaterialSchema,
} from "../validators/inventory.validator.js";

function requireBusinessId(req: Request) {
  if (!req.user?.businessId) {
    const error = new Error("Authenticated business context is missing.");
    error.name = "UNAUTHORIZED";
    throw error;
  }
  return req.user.businessId;
}

export async function listMaterials(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const query = materialQuerySchema.parse(req.query);

    const materials = await inventoryService.listMaterials(businessId, query);

    return res.status(200).json({
      success: true,
      data: materials,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getInventorySummary(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);

    const summary = await inventoryService.getInventorySummary(businessId);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMaterial(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { id } = materialParamsSchema.parse(req.params);

    const material = await inventoryService.getMaterial(businessId, id);

    return res.status(200).json({
      success: true,
      data: material,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createMaterial(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const input = createMaterialSchema.parse(req.body);
    const userId = req.user?.id;

    const material = await inventoryService.createMaterial(
      businessId,
      input,
      userId,
    );

    return res.status(201).json({
      success: true,
      data: material,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateMaterial(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { id } = materialParamsSchema.parse(req.params);
    const input = updateMaterialSchema.parse(req.body);

    const material = await inventoryService.updateMaterial(
      businessId,
      id,
      input,
    );

    return res.status(200).json({
      success: true,
      data: material,
    });
  } catch (error) {
    return next(error);
  }
}

export async function adjustStock(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { id } = materialParamsSchema.parse(req.params);
    const input = adjustStockSchema.parse(req.body);
    const userId = req.user?.id;

    const material = await inventoryService.adjustStock(
      businessId,
      id,
      input,
      userId,
    );

    return res.status(200).json({
      success: true,
      data: material,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteMaterial(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { id } = materialParamsSchema.parse(req.params);

    await inventoryService.deleteMaterial(businessId, id);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
