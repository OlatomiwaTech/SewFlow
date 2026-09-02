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

export function formatOrderSummary(
  order: Prisma.OrderGetPayload<{ include: { payments: true } }>,
) {
  const totalAmount = Number(order.totalAmount);

  let totalPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);

  // Preserve legacy depositAmount if no Payment records exist
  if (order.payments.length === 0 && Number(order.depositAmount) > 0) {
    totalPaid = Number(order.depositAmount);
  }

  const balanceDue = Math.max(0, totalAmount - totalPaid);

  let paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  if (totalPaid === 0) {
    paymentStatus = "UNPAID";
  } else if (totalPaid < totalAmount) {
    paymentStatus = "PARTIALLY_PAID";
  } else {
    paymentStatus = "PAID";
  }

  return {
    ...order,
    totalPaid,
    balanceDue,
    paymentStatus,
  };
}

export async function listOrders(businessId: string, customerId: string) {
  await verifyCustomerOwnership(businessId, customerId);

  const orders = await prisma.order.findMany({
    where: {
      customerId,
    },
    include: {
      payments: {
        orderBy: {
          paymentDate: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return orders.map(formatOrderSummary);
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
    include: {
      payments: {
        orderBy: {
          paymentDate: "desc",
        },
      },
    },
  });

  if (!order) {
    const error = new Error("Order not found.");
    error.name = "NOT_FOUND";
    throw error;
  }

  return formatOrderSummary(order);
}

export async function createOrder(
  businessId: string,
  customerId: string,
  input: CreateOrderInput,
) {
  await verifyCustomerOwnership(businessId, customerId);

  const deposit = input.depositAmount ?? 0;

  const order = await prisma.order.create({
    data: {
      customerId,
      garmentType: input.garmentType.trim(),
      description: input.description?.trim() || null,
      quantity: input.quantity ?? 1,
      totalAmount: new Prisma.Decimal(input.totalAmount),
      depositAmount: new Prisma.Decimal(deposit),
      expectedDate: input.expectedDate ? new Date(input.expectedDate) : null,
      notes: input.notes?.trim() || null,
      ...(deposit > 0 && {
        payments: {
          create: {
            amount: new Prisma.Decimal(deposit),
            method: "CASH",
            notes: "Initial deposit upon order creation",
          },
        },
      }),
    },
    include: {
      payments: true,
    },
  });

  return formatOrderSummary(order);
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
    include: {
      payments: true,
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
  const existingPaid = existing.payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0,
  );

  if (existingPaid > effectiveTotal) {
    const error = new Error("Total amount cannot be less than total payments already recorded.");
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

  const updatedOrder = await prisma.order.update({
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
    include: {
      payments: {
        orderBy: {
          paymentDate: "desc",
        },
      },
    },
  });

  return formatOrderSummary(updatedOrder);
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
