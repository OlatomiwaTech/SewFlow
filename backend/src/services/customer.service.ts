import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import type {
  CreateCustomerInput,
  CustomerQuery,
  UpdateCustomerInput,
} from "../validators/customer.validator.js";

function normalizeOptional(value?: string) {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
}

export async function createCustomer(
  businessId: string,
  input: CreateCustomerInput,
) {
  return prisma.customer.create({
    data: {
      businessId,
      firstName: input.firstName.trim(),
      lastName: normalizeOptional(input.lastName),
      phone: input.phone.trim(),
      email: normalizeOptional(input.email),
      address: normalizeOptional(input.address),
      notes: normalizeOptional(input.notes),
    },
  });
}

export async function listCustomers(
  businessId: string,
  query: CustomerQuery,
) {
  const { search, page, limit } = query;

  const where: Prisma.CustomerWhereInput = {
    businessId,
  };

  if (search) {
    where.OR = [
      {
        firstName: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        lastName: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        phone: {
          contains: search,
        },
      },
      {
        email: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  const skip = (page - 1) * limit;

  const [customers, total] = await prisma.$transaction([
    prisma.customer.findMany({
      where,
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      skip,
      take: limit,
    }),
    prisma.customer.count({
      where,
    }),
  ]);

  return {
    customers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCustomer(
  businessId: string,
  customerId: string,
) {
  return prisma.customer.findFirst({
    where: {
      id: customerId,
      businessId,
    },
  });
}

export async function updateCustomer(
  businessId: string,
  customerId: string,
  input: UpdateCustomerInput,
) {
  const existing = await prisma.customer.findFirst({
    where: {
      id: customerId,
      businessId,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    return null;
  }

  return prisma.customer.update({
    where: {
      id: existing.id,
    },
    data: {
      ...(input.firstName !== undefined && {
        firstName: input.firstName.trim(),
      }),
      ...(input.lastName !== undefined && {
        lastName: normalizeOptional(input.lastName),
      }),
      ...(input.phone !== undefined && {
        phone: input.phone.trim(),
      }),
      ...(input.email !== undefined && {
        email: normalizeOptional(input.email),
      }),
      ...(input.address !== undefined && {
        address: normalizeOptional(input.address),
      }),
      ...(input.notes !== undefined && {
        notes: normalizeOptional(input.notes),
      }),
    },
  });
}

export async function deleteCustomer(
  businessId: string,
  customerId: string,
) {
  const existing = await prisma.customer.findFirst({
    where: {
      id: customerId,
      businessId,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    return null;
  }

  return prisma.customer.delete({
    where: {
      id: existing.id,
    },
  });
}