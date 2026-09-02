import type { NextFunction, Request, Response } from "express";
import * as paymentService from "../services/payment.service.js";
import {
  createPaymentSchema,
  orderNestedParamsSchema,
  paymentParamsSchema,
  updatePaymentSchema,
} from "../validators/payment.validator.js";

function requireBusinessId(req: Request) {
  if (!req.user?.businessId) {
    const error = new Error("Authenticated business context is missing.");
    error.name = "UNAUTHORIZED";
    throw error;
  }
  return req.user.businessId;
}

export async function listPayments(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { customerId, orderId } = orderNestedParamsSchema.parse(req.params);

    const payments = await paymentService.listPayments(
      businessId,
      customerId,
      orderId,
    );

    return res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getPayment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { customerId, orderId, paymentId } = paymentParamsSchema.parse(req.params);

    const payment = await paymentService.getPayment(
      businessId,
      customerId,
      orderId,
      paymentId,
    );

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createPayment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { customerId, orderId } = orderNestedParamsSchema.parse(req.params);
    const input = createPaymentSchema.parse(req.body);

    const payment = await paymentService.createPayment(
      businessId,
      customerId,
      orderId,
      input,
    );

    return res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updatePayment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { customerId, orderId, paymentId } = paymentParamsSchema.parse(req.params);
    const input = updatePaymentSchema.parse(req.body);

    const payment = await paymentService.updatePayment(
      businessId,
      customerId,
      orderId,
      paymentId,
      input,
    );

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deletePayment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const businessId = requireBusinessId(req);
    const { customerId, orderId, paymentId } = paymentParamsSchema.parse(req.params);

    await paymentService.deletePayment(
      businessId,
      customerId,
      orderId,
      paymentId,
    );

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
