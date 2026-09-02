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
  const order = await verifyOrderOwnership(businessId, customerId, orderId);

  const orderTotal = Number(order.totalAmount);
  const currentTotalPaid = order.payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0,
  );

  // If order has an unmigrated depositAmount and no Payment records exist, treat deposit as initial payment sum
  const effectivePaid =
    order.payments.length === 0 && Number(order.depositAmount) > 0
      ? Number(order.depositAmount)
      : currentTotalPaid;

  const newTotalPaid = effectivePaid + input.amount;

  if (newTotalPaid > orderTotal) {
    const remaining = Math.max(0, orderTotal - effectivePaid);
    const error = new Error(
      `Payment amount (${input.amount}) exceeds remaining balance (${remaining}).`,
    );
    error.name = "VALIDATION_ERROR";
    throw error;
  }

  return prisma.payment.create({
    data: {
      orderId: order.id,
      amount: new Prisma.Decimal(input.amount),
      method: input.method,
      reference: input.reference?.trim() || null,
      paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
      notes: input.notes?.trim() || null,
    },
  });
}

export async function updatePayment(
  businessId: string,
  customerId: string,
  orderId: string,
  paymentId: string,
  input: UpdatePaymentInput,
) {
  const order = await verifyOrderOwnership(businessId, customerId, orderId);

  const existingPayment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      orderId: order.id,
    },
  });

  if (!existingPayment) {
    const error = new Error("Payment record not found.");
    error.name = "NOT_FOUND";
    throw error;
  }

  const orderTotal = Number(order.totalAmount);
  const otherPaymentsPaid = order.payments
    .filter((p) => p.id !== paymentId)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const targetAmount =
    input.amount !== undefined
      ? input.amount
      : Number(existingPayment.amount);

  const newTotalPaid = otherPaymentsPaid + targetAmount;

  if (newTotalPaid > orderTotal) {
    const remaining = Math.max(0, orderTotal - otherPaymentsPaid);
    const error = new Error(
      `Payment amount (${targetAmount}) exceeds remaining balance (${remaining}).`,
    );
    error.name = "VALIDATION_ERROR";
    throw error;
  }

  return prisma.payment.update({
    where: {
      id: existingPayment.id,
    },
    data: {
      ...(input.amount !== undefined && {
        amount: new Prisma.Decimal(input.amount),
      }),
      ...(input.method !== undefined && { method: input.method }),
      ...(input.reference !== undefined && {
        reference: input.reference?.trim() || null,
      }),
      ...(input.paymentDate !== undefined && {
        paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
      }),
      ...(input.notes !== undefined && {
        notes: input.notes?.trim() || null,
      }),
    },
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
