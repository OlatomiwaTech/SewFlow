import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import type {
  CreatePaymentInput,
  UpdatePaymentInput,
} from "../validators/payment.validator.js";

async function verifyOrderOwnership(
  businessId: string,
  customerId: string,
  orderId: string,
) {
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      businessId,
    },
    select: { id: true },
  });

  if (!customer) {
    const error = new Error("Customer not found.");
    error.name = "NOT_FOUND";
    throw error;
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      customerId,
      businessId,
    },
    include: {
      payments: true,
    },
  });

  if (!order) {
    const error = new Error("Order not found.");
    error.name = "NOT_FOUND";
    throw error;
  }

  return order;
}

export async function listPayments(
  businessId: string,
  customerId: string,
  orderId: string,
) {
  const order = await verifyOrderOwnership(businessId, customerId, orderId);

  return prisma.payment.findMany({
    where: {
      orderId: order.id,
      businessId,
    },
    orderBy: {
      paymentDate: "desc",
    },
  });
}

export async function getPayment(
  businessId: string,
  customerId: string,
  orderId: string,
  paymentId: string,
) {
  const order = await verifyOrderOwnership(businessId, customerId, orderId);

  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      orderId: order.id,
      businessId,
    },
  });

  if (!payment) {
    const error = new Error("Payment record not found.");
    error.name = "NOT_FOUND";
    throw error;
  }

  return payment;
}

export async function createPayment(
  businessId: string,
  customerId: string,
  orderId: string,
  input: CreatePaymentInput,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} AND "businessId" = ${businessId} FOR UPDATE`;
    const order = await tx.order.findFirst({
      where: { id: orderId, customerId, businessId, deletedAt: null },
      include: { payments: true },
    });

    if (!order) {
      const error = new Error("Order not found.");
      error.name = "NOT_FOUND";
      throw error;
    }

    if (input.idempotencyKey) {
      const existingPayment = await tx.payment.findFirst({
        where: { orderId: order.id, idempotencyKey: input.idempotencyKey },
      });
      if (existingPayment) return existingPayment;
    }

    const orderTotal = new Prisma.Decimal(order.totalAmount);
    const currentTotalPaid = order.payments.reduce(
      (sum, payment) => sum.plus(payment.amount),
      new Prisma.Decimal(0),
    );
    const inputAmount = new Prisma.Decimal(input.amount).toDecimalPlaces(2);
    const newTotalPaid = currentTotalPaid.plus(inputAmount);

    if (newTotalPaid.gt(orderTotal)) {
      const remaining = Prisma.Decimal.max(orderTotal.minus(currentTotalPaid), new Prisma.Decimal(0));
      const error = new Error(
        `Payment amount (${inputAmount.toFixed(2)}) exceeds remaining balance (${remaining.toFixed(2)}).`,
      );
      error.name = "VALIDATION_ERROR";
      throw error;
    }

    return tx.payment.create({
      data: {
        businessId,
        orderId: order.id,
        amount: inputAmount,
        method: input.method,
        reference: input.reference?.trim() || null,
        idempotencyKey: input.idempotencyKey?.trim() || null,
        paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
        notes: input.notes?.trim() || null,
      },
    });
  });
}

export async function updatePayment(
  businessId: string,
  customerId: string,
  orderId: string,
  paymentId: string,
  input: UpdatePaymentInput,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} AND "businessId" = ${businessId} FOR UPDATE`;
    const order = await tx.order.findFirst({
      where: { id: orderId, customerId, businessId, deletedAt: null },
      include: { payments: true },
    });
    const existingPayment = await tx.payment.findFirst({
      where: { id: paymentId, orderId, businessId, deletedAt: null },
    });

    if (!order || !existingPayment) {
      const error = new Error(!order ? "Order not found." : "Payment record not found.");
      error.name = "NOT_FOUND";
      throw error;
    }

    const orderTotal = new Prisma.Decimal(order.totalAmount);
    const otherPaymentsPaid = order.payments
      .filter((payment) => payment.id !== paymentId)
      .reduce((sum, payment) => sum.plus(payment.amount), new Prisma.Decimal(0));
    const targetAmount = new Prisma.Decimal(
      input.amount !== undefined ? input.amount : existingPayment.amount,
    ).toDecimalPlaces(2);
    const newTotalPaid = otherPaymentsPaid.plus(targetAmount);

    if (newTotalPaid.gt(orderTotal)) {
      const remaining = Prisma.Decimal.max(orderTotal.minus(otherPaymentsPaid), new Prisma.Decimal(0));
      const error = new Error(
        `Payment amount (${targetAmount.toFixed(2)}) exceeds remaining balance (${remaining.toFixed(2)}).`,
      );
      error.name = "VALIDATION_ERROR";
      throw error;
    }

    return tx.payment.update({
      where: { id: existingPayment.id },
      data: {
        ...(input.amount !== undefined && { amount: targetAmount }),
        ...(input.method !== undefined && { method: input.method }),
        ...(input.reference !== undefined && { reference: input.reference?.trim() || null }),
        ...(input.paymentDate !== undefined && {
          paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
        }),
        ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
      },
    });
  });
}

export async function deletePayment(
  businessId: string,
  customerId: string,
  orderId: string,
  paymentId: string,
) {
  const order = await verifyOrderOwnership(businessId, customerId, orderId);

  const existingPayment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      orderId: order.id,
      businessId,
    },
    select: { id: true },
  });

  if (!existingPayment) {
    const error = new Error("Payment record not found.");
    error.name = "NOT_FOUND";
    throw error;
  }

  return prisma.payment.delete({
    where: {
      id: existingPayment.id,
    },
  });
}
