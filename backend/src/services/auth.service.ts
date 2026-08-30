import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";
import { signAccessToken } from "../lib/jwt.js";
import type { LoginInput, RegisterInput } from "../validators/auth.validator.js";

const SALT_ROUNDS = 12;

function sanitizeUser(user: {
  id: string;
  businessId: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}) {
  return {
    id: user.id,
    businessId: user.businessId,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

export async function register(input: RegisterInput) {
  const existingUser = await prisma.user.findFirst({
    where: {
      email: input.email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    const error = new Error("Unable to create account with these details.");
    error.name = "CONFLICT";
    throw error;
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const result = await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        name: input.businessName,
        currency: "NGN",
        timezone: "Africa/Lagos",
      },
    });

    const user = await tx.user.create({
      data: {
        businessId: business.id,
        name: input.name,
        email: input.email,
        passwordHash,
        role: "OWNER",
        isActive: true,
      },
    });

    return { business, user };
  });

  const token = signAccessToken({
    userId: result.user.id,
    businessId: result.business.id,
    role: result.user.role,
  });

  return {
    token,
    user: sanitizeUser(result.user),
    business: {
      id: result.business.id,
      name: result.business.name,
      currency: result.business.currency,
      timezone: result.business.timezone,
    },
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findFirst({
    where: {
      email: input.email,
    },
    include: {
      business: true,
    },
  });

  if (!user?.isActive) {
    const error = new Error("Invalid email or password.");
    error.name = "UNAUTHORIZED";
    throw error;
  }

  const passwordValid = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordValid) {
    const error = new Error("Invalid email or password.");
    error.name = "UNAUTHORIZED";
    throw error;
  }

  const token = signAccessToken({
    userId: user.id,
    businessId: user.businessId,
    role: user.role,
  });

  return {
    token,
    user: sanitizeUser(user),
    business: {
      id: user.business.id,
      name: user.business.name,
      currency: user.business.currency,
      timezone: user.business.timezone,
    },
  };
}

export async function getCurrentUser(userId: string, businessId: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      businessId,
    },
    include: {
      business: true,
    },
  });

  if (!user?.isActive) {
    const error = new Error("Authenticated user not found.");
    error.name = "UNAUTHORIZED";
    throw error;
  }

  return {
    user: sanitizeUser(user),
    business: {
      id: user.business.id,
      name: user.business.name,
      currency: user.business.currency,
      timezone: user.business.timezone,
    },
  };
}