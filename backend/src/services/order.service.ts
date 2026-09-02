import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import type {
  CreateOrderInput,
  UpdateOrderInput,
} from "../validators/order.validator.js";

async function verifyCustomerOwnership(businessId: string, customerId: string) {
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

  return customer;
}

export async function listOrders(businessId: string, customerId: string) {
  await verifyCustomerOwnership(businessId, customerId);

  return prisma.order.findMany({
    where: {
      customerId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getOrder(
  businessId: string,
  customerId: string,
  orderId: string,
) {
  await verifyCustomerOwnership(businessId, customerId);

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      customerId,
    },
  });

  if (!order) {
    const error = new Error("Order not found.");
    error.name = "NOT_FOUND";
    throw error;
  }

  return order;
}

export async function createOrder(
  businessId: string,
  customerId: string,
  input: CreateOrderInput,
) {
  await verifyCustomerOwnership(businessId, customerId);

  return prisma.order.create({
    data: {
      customerId,
      garmentType: input.garmentType.trim(),
      description: input.description?.trim() || null,
      quantity: input.quantity ?? 1,
      totalAmount: new Prisma.Decimal(input.totalAmount),
      depositAmount: new Prisma.Decimal(input.depositAmount ?? 0),
      expectedDate: input.expectedDate ? new Date(input.expectedDate) : null,
      notes: input.notes?.trim() || null,
    },
  });
}

export async function updateOrder(
  businessId: string,
  customerId: string,
  orderId: string,
  input: UpdateOrderInput,
) {
  await verifyCustomerOwnership(businessId, customerId);

  const existing = await prisma.order.findFirst({
    where: {
      id: orderId,
      customerId,
    },
  });

  if (!existing) {
    const error = new Error("Order not found.");
    error.name = "NOT_FOUND";
    throw error;
  }

  const effectiveTotal =
    input.totalAmount !== undefined
      ? input.totalAmount
      : Number(existing.totalAmount);
  const effectiveDeposit =
    input.depositAmount !== undefined
      ? input.depositAmount
      : Number(existing.depositAmount);

  if (effectiveDeposit > effectiveTotal) {
    const error = new Error("Deposit amount cannot exceed the total amount.");
    error.name = "VALIDATION_ERROR";
    throw error;
  }

  let deliveredAt = existing.deliveredAt;
  if (input.status !== undefined) {
    if (input.status === "DELIVERED" && existing.status !== "DELIVERED") {
      deliveredAt = new Date();
    } else if (input.status !== "DELIVERED" && existing.status === "DELIVERED") {
      deliveredAt = null;
    }
  }

  return prisma.order.update({
    where: {
      id: existing.id,
    },
    data: {
      ...(input.garmentType !== undefined && {
        garmentType: input.garmentType.trim(),
      }),
      ...(input.description !== undefined && {
        description: input.description?.trim() || null,
      }),
      ...(input.quantity !== undefined && { quantity: input.quantity }),
      ...(input.totalAmount !== undefined && {
        totalAmount: new Prisma.Decimal(input.totalAmount),
      }),
      ...(input.depositAmount !== undefined && {
        depositAmount: new Prisma.Decimal(input.depositAmount),
      }),
      ...(input.status !== undefined && { status: input.status }),
      deliveredAt,
      ...(input.expectedDate !== undefined && {
        expectedDate: input.expectedDate ? new Date(input.expectedDate) : null,
      }),
      ...(input.notes !== undefined && {
        notes: input.notes?.trim() || null,
      }),
    },
  });
}

export async function deleteOrder(
  businessId: string,
  customerId: string,
  orderId: string,
) {
  await verifyCustomerOwnership(businessId, customerId);

  const existing = await prisma.order.findFirst({
    where: {
      id: orderId,
      customerId,
    },
    select: { id: true },
  });

  if (!existing) {
    const error = new Error("Order not found.");
    error.name = "NOT_FOUND";
    throw error;
  }

  return prisma.order.delete({
    where: {
      id: existing.id,
    },
  });
}
