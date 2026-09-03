import { OrderStatus, Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import type {
  CreateOrderInput,
  OrderQueryInput,
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
  order: Prisma.OrderGetPayload<{
    include: { payments: true; customer: true; history: true };
  }>,
) {
  const totalAmount = Number(order.totalAmount);

  let totalPaid = order.payments ? order.payments.reduce((sum, p) => sum + Number(p.amount), 0) : 0;

  // Preserve legacy depositAmount if no Payment records exist
  if ((!order.payments || order.payments.length === 0) && Number(order.depositAmount) > 0) {
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
      customer: true,
      payments: {
        orderBy: {
          paymentDate: "desc",
        },
      },
      history: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return orders.map(formatOrderSummary);
}

export async function listAllOrders(businessId: string, query?: OrderQueryInput) {
  const whereClause: Prisma.OrderWhereInput = {
    customer: {
      businessId,
    },
  };

  if (query?.status) {
    whereClause.status = query.status;
  }

  if (query?.priority) {
    whereClause.priority = query.priority;
  }

  if (query?.customerId) {
    whereClause.customerId = query.customerId;
  }

  if (query?.search) {
    const s = query.search.trim();
    whereClause.OR = [
      { garmentType: { contains: s, mode: "insensitive" } },
      { description: { contains: s, mode: "insensitive" } },
      { customer: { firstName: { contains: s, mode: "insensitive" } } },
      { customer: { lastName: { contains: s, mode: "insensitive" } } },
    ];
  }

  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      customer: true,
      payments: {
        orderBy: {
          paymentDate: "desc",
        },
      },
      history: {
        orderBy: {
          createdAt: "desc",
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
      customer: true,
      payments: {
        orderBy: {
          paymentDate: "desc",
        },
      },
      history: {
        orderBy: {
          createdAt: "desc",
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
  const initialStatus = input.status || OrderStatus.NEW;

  const createData: Prisma.OrderCreateInput = {
    customer: {
      connect: { id: customerId },
    },
    garmentType: input.garmentType.trim(),
    description: input.description?.trim() || null,
    quantity: input.quantity ?? 1,
    totalAmount: new Prisma.Decimal(input.totalAmount),
    depositAmount: new Prisma.Decimal(deposit),
    priority: input.priority || "MEDIUM",
    status: initialStatus,
    expectedDate: input.expectedDate ? new Date(input.expectedDate) : null,
    notes: input.notes?.trim() || null,
    history: {
      create: [
        {
          toStatus: initialStatus,
          note: `Order created in ${initialStatus} status`,
        },
      ],
    },
  };

  if (deposit > 0) {
    createData.payments = {
      create: [
        {
          amount: new Prisma.Decimal(deposit),
          method: "CASH",
          notes: "Initial deposit upon order creation",
        },
      ],
    };
  }

  const created = await prisma.order.create({
    data: createData,
    select: { id: true },
  });

  return getOrder(businessId, customerId, created.id);
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
      customer: true,
      history: true,
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
    if (input.status === OrderStatus.DELIVERED && existing.status !== OrderStatus.DELIVERED) {
      deliveredAt = new Date();
    } else if (input.status !== OrderStatus.DELIVERED && existing.status === OrderStatus.DELIVERED) {
      deliveredAt = null;
    }
  }

  const historyEntriesToCreate: Prisma.OrderHistoryCreateWithoutOrderInput[] = [];

  if (input.status !== undefined && input.status !== existing.status) {
    historyEntriesToCreate.push({
      fromStatus: existing.status,
      toStatus: input.status,
      note: `Status updated from ${existing.status} to ${input.status}`,
    });
  }

  if (input.priority !== undefined && input.priority !== existing.priority) {
    historyEntriesToCreate.push({
      fromStatus: existing.status,
      toStatus: input.status || existing.status,
      note: `Priority changed from ${existing.priority} to ${input.priority}`,
    });
  }

  await prisma.order.update({
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
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.status !== undefined && { status: input.status }),
      deliveredAt,
      ...(input.expectedDate !== undefined && {
        expectedDate: input.expectedDate ? new Date(input.expectedDate) : null,
      }),
      ...(input.notes !== undefined && {
        notes: input.notes?.trim() || null,
      }),
      ...(historyEntriesToCreate.length > 0 && {
        history: {
          create: historyEntriesToCreate,
        },
      }),
    },
  });

  return getOrder(businessId, customerId, existing.id);
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

export async function getProductionMetrics(businessId: string) {
  const orders = await prisma.order.findMany({
    where: {
      customer: {
        businessId,
      },
    },
    include: {
      payments: true,
    },
  });

  const totalOrders = orders.length;
  let activeOrders = 0;
  let completedOrders = 0;
  let urgentOrders = 0;
  let totalRevenue = 0;
  let totalCollected = 0;

  const statusCounts: Record<string, number> = {
    NEW: 0,
    MEASURED: 0,
    CUTTING: 0,
    SEWING: 0,
    FITTING: 0,
    READY: 0,
    DELIVERED: 0,
    CANCELLED: 0,
    PENDING: 0,
    IN_PROGRESS: 0,
  };

  orders.forEach((order) => {
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;

    const total = Number(order.totalAmount);
    const paid = order.payments.reduce((s, p) => s + Number(p.amount), 0);

    totalRevenue += total;
    totalCollected += paid;

    if (order.status === OrderStatus.DELIVERED) {
      completedOrders += 1;
    } else if (order.status !== OrderStatus.CANCELLED) {
      activeOrders += 1;
      if (order.priority === "URGENT" || order.priority === "HIGH") {
        urgentOrders += 1;
      }
    }
  });

  const balanceOutstanding = Math.max(0, totalRevenue - totalCollected);

  return {
    totalOrders,
    activeOrders,
    completedOrders,
    urgentOrders,
    totalRevenue,
    totalCollected,
    balanceOutstanding,
    statusCounts,
  };
}
