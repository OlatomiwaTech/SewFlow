import Decimal from "decimal.js";
import { OrderStatus, Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
  CreateOrderInput,
  OrderQueryInput,
  UpdateOrderInput,
} from "../validators/order.validator.js";

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: [OrderStatus.MEASURED, OrderStatus.CANCELLED],
  MEASURED: [OrderStatus.CUTTING, OrderStatus.CANCELLED],
  CUTTING: [OrderStatus.SEWING, OrderStatus.CANCELLED],
  SEWING: [OrderStatus.FITTING, OrderStatus.CANCELLED],
  FITTING: [OrderStatus.READY, OrderStatus.CANCELLED],
  READY: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  DELIVERED: [],
  CANCELLED: [],
  PENDING: [OrderStatus.MEASURED, OrderStatus.CUTTING, OrderStatus.CANCELLED],
  IN_PROGRESS: [OrderStatus.READY, OrderStatus.CANCELLED],
};

const toDecimal = (value: number | string | Prisma.Decimal): Decimal =>
  new Decimal(value.toString());

function validateStatusTransition(currentStatus: OrderStatus, nextStatus: OrderStatus): void {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(nextStatus)) {
    throw new AppError(
      `Invalid status transition from ${currentStatus} to ${nextStatus}.`,
      400,
      true,
      "INVALID_STATUS_TRANSITION",
    );
  }
}

async function verifyCustomerOwnership(businessId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      businessId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!customer) {
    throw new AppError("Customer not found.", 404, true, "NOT_FOUND");
  }

  return customer;
}

export function formatOrderSummary(
  order: Prisma.OrderGetPayload<{
    include: { payments: true; customer: true; history: true };
  }>,
) {
  const totalAmount = Number(toDecimal(order.totalAmount).toFixed(2));

  const rawPaid = order.payments && Array.isArray(order.payments) && order.payments.length > 0
    ? order.payments.reduce((sum, payment) => sum + Number(toDecimal(payment.amount).toFixed(2)), 0)
    : Number(toDecimal(order.depositAmount || 0).toFixed(2));

  const totalPaid = Number(new Decimal(rawPaid).toFixed(2));
  const balanceDue = Math.max(0, Number(new Decimal(totalAmount).minus(totalPaid).toFixed(2)));

  let paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  if (totalPaid <= 0) {
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
      businessId,
      customerId,
      deletedAt: null,
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
    businessId,
    deletedAt: null,
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
    const search = query.search.trim();
    whereClause.OR = [
      { garmentType: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { customer: { firstName: { contains: search, mode: "insensitive" } } },
      { customer: { lastName: { contains: search, mode: "insensitive" } } },
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
      businessId,
      deletedAt: null,
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
    throw new AppError("Order not found.", 404, true, "NOT_FOUND");
  }

  return formatOrderSummary(order);
}

export async function createOrder(
  businessId: string,
  customerId: string,
  input: CreateOrderInput,
) {
  await verifyCustomerOwnership(businessId, customerId);

  const deposit = Number(toDecimal(input.depositAmount ?? 0).toFixed(2));
  const initialStatus = input.status ?? OrderStatus.NEW;

  if (initialStatus === OrderStatus.DELIVERED) {
    throw new AppError("An order cannot be created as delivered.", 400, true, "INVALID_STATUS_TRANSITION");
  }

  const createData: Prisma.OrderCreateInput = {
    business: {
      connect: { id: businessId },
    },
    customer: {
      connect: { id: customerId },
    },
    garmentType: input.garmentType.trim(),
    description: input.description?.trim() || null,
    quantity: input.quantity ?? 1,
    totalAmount: new Prisma.Decimal(toDecimal(input.totalAmount).toFixed(2)),
    depositAmount: new Prisma.Decimal(toDecimal(deposit).toFixed(2)),
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
          business: {
            connect: { id: businessId },
          },
          amount: new Prisma.Decimal(toDecimal(deposit).toFixed(2)),
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
      businessId,
      deletedAt: null,
    },
    include: {
      payments: true,
      customer: true,
      history: true,
    },
  });

  if (!existing) {
    throw new AppError("Order not found.", 404, true, "NOT_FOUND");
  }

  if (input.status && input.status !== existing.status) {
    validateStatusTransition(existing.status, input.status);
  }

  const effectiveTotal = input.totalAmount !== undefined
    ? Number(toDecimal(input.totalAmount).toFixed(2))
    : Number(toDecimal(existing.totalAmount).toFixed(2));

  const existingPaid = existing.payments.reduce(
    (sum, payment) => sum + Number(toDecimal(payment.amount).toFixed(2)),
    0,
  );

  if (existingPaid > effectiveTotal) {
    throw new AppError("Total amount cannot be less than total payments already recorded.", 400, true, "VALIDATION_ERROR");
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
      toStatus: input.status ?? existing.status,
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
        totalAmount: new Prisma.Decimal(toDecimal(input.totalAmount).toFixed(2)),
      }),
      ...(input.depositAmount !== undefined && {
        depositAmount: new Prisma.Decimal(toDecimal(input.depositAmount).toFixed(2)),
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
      businessId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError("Order not found.", 404, true, "NOT_FOUND");
  }

  return prisma.order.update({
    where: { id: existing.id },
    data: {
      deletedAt: new Date(),
      status: OrderStatus.CANCELLED,
    },
  });
}

export async function getProductionMetrics(businessId: string) {
  const orders = await prisma.order.findMany({
    where: {
      businessId,
      deletedAt: null,
    },
    include: {
      payments: true,
    },
  });

  const totalOrders = orders.length;
  let activeOrders = 0;
  let completedOrders = 0;
  let urgentOrders = 0;
  let rawRevenue = 0;
  let rawCollected = 0;

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

    const total = Number(toDecimal(order.totalAmount).toFixed(2));
    const paid = order.payments.reduce(
      (sum, payment) => sum + Number(toDecimal(payment.amount).toFixed(2)),
      0,
    );

    rawRevenue += total;
    rawCollected += paid;

    if (order.status === OrderStatus.DELIVERED) {
      completedOrders += 1;
    } else if (order.status !== OrderStatus.CANCELLED) {
      activeOrders += 1;
      if (order.priority === "URGENT" || order.priority === "HIGH") {
        urgentOrders += 1;
      }
    }
  });

  return {
    totalOrders,
    activeOrders,
    completedOrders,
    urgentOrders,
    totalRevenue: Number(new Decimal(rawRevenue).toFixed(2)),
    totalCollected: Number(new Decimal(rawCollected).toFixed(2)),
    balanceOutstanding: Number(
      new Decimal(rawRevenue).minus(rawCollected).max(0).toFixed(2),
    ),
    statusCounts,
  };
}
