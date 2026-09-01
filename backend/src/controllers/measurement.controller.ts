import type { NextFunction, Request, Response } from "express";
import * as measurementService from "../services/measurement.service.js";
import {
  createMeasurementSchema,
  customerParamsSchema,
  measurementParamsSchema,
  updateMeasurementSchema,
} from "../validators/measurement.validator.js";

function requireBusinessId(req: Request) {
  if (!req.user?.businessId) {
    const error = new Error("Authenticated business context is missing.");
    error.name = "UNAUTHORIZED";
    throw error;
  }
  return req.user.businessId;
}

export async function listMeasurements(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { customerId } = customerParamsSchema.parse(req.params);

    const measurements = await measurementService.listMeasurements(
      businessId,
      customerId,
    );

    return res.status(200).json({
      success: true,
      data: measurements,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMeasurement(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { customerId, measurementId } = measurementParamsSchema.parse(req.params);

    const measurement = await measurementService.getMeasurement(
      businessId,
      customerId,
      measurementId,
    );

    return res.status(200).json({
      success: true,
      data: measurement,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createMeasurement(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { customerId } = customerParamsSchema.parse(req.params);
    const input = createMeasurementSchema.parse(req.body);

    const measurement = await measurementService.createMeasurement(
      businessId,
      customerId,
      input,
    );

    return res.status(201).json({
      success: true,
      data: measurement,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateMeasurement(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { customerId, measurementId } = measurementParamsSchema.parse(req.params);
    const input = updateMeasurementSchema.parse(req.body);

    const measurement = await measurementService.updateMeasurement(
      businessId,
      customerId,
      measurementId,
      input,
    );

    return res.status(200).json({
      success: true,
      data: measurement,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteMeasurement(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { customerId, measurementId } = measurementParamsSchema.parse(req.params);

    await measurementService.deleteMeasurement(
      businessId,
      customerId,
      measurementId,
    );

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
