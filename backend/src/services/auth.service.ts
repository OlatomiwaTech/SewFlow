import bcrypt from "bcrypt";
import { createHash, randomBytes } from "node:crypto";
import prisma from "../lib/prisma.js";
import { signAccessToken } from "../lib/jwt.js";
import { connectRedis, redisClient } from "../lib/redis.js";
import type { LoginInput, RegisterInput } from "../validators/auth.validator.js";

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const REFRESH_TOKEN_PREFIX = "sewflow:refresh:";

interface RefreshSession {
  userId: string;
  businessId: string;
}

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function issueRefreshToken(session: RefreshSession): Promise<string | null> {
  if (!redisClient) return null;
  await connectRedis();

  const token = randomBytes(40).toString("hex");
  await redisClient.set(
    `${REFRESH_TOKEN_PREFIX}${hashRefreshToken(token)}`,
    JSON.stringify(session),
    { EX: REFRESH_TOKEN_TTL_SECONDS },
  );
  return token;
}

async function rotateRefreshToken(token: string): Promise<RefreshSession> {
  if (!redisClient) {
    const error = new Error("Refresh token service is unavailable.");
    error.name = "SERVICE_UNAVAILABLE";
    throw error;
  }

  await connectRedis();
  const key = `${REFRESH_TOKEN_PREFIX}${hashRefreshToken(token)}`;
  const serialized = await redisClient.getDel(key);
  if (!serialized) {
    const error = new Error("Invalid or expired refresh token.");
    error.name = "UNAUTHORIZED";
    throw error;
  }

  try {
    return JSON.parse(serialized) as RefreshSession;
  } catch {
    const error = new Error("Invalid or expired refresh token.");
    error.name = "UNAUTHORIZED";
    throw error;
  }
}

async function withRefreshToken<T extends { userId: string; businessId: string }>(
  session: T,
): Promise<string | null> {
  return issueRefreshToken({ userId: session.userId, businessId: session.businessId });
}

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
    email: result.user.email,
    businessId: result.business.id,
    role: result.user.role,
  });
  const refreshToken = await withRefreshToken({
    userId: result.user.id,
    businessId: result.business.id,
  });

  return {
    token,
    refreshToken,
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
    email: user.email,
    businessId: user.businessId,
    role: user.role,
  });
  const refreshToken = await withRefreshToken({
    userId: user.id,
    businessId: user.businessId,
  });

  return {
    token,
    refreshToken,
    user: sanitizeUser(user),
    business: {
      id: user.business.id,
      name: user.business.name,
      currency: user.business.currency,
      timezone: user.business.timezone,
    },
  };
}

export async function refresh(refreshToken: string) {
  const session = await rotateRefreshToken(refreshToken);
  const user = await prisma.user.findFirst({
    where: {
      id: session.userId,
      businessId: session.businessId,
      isActive: true,
      deletedAt: null,
    },
    include: { business: true },
  });

  if (!user) {
    const error = new Error("Invalid or expired refresh token.");
    error.name = "UNAUTHORIZED";
    throw error;
  }

  const token = signAccessToken({
    userId: user.id,
    email: user.email,
    businessId: user.businessId,
    role: user.role,
  });
  const nextRefreshToken = await withRefreshToken({
    userId: user.id,
    businessId: user.businessId,
  });

  return { token, refreshToken: nextRefreshToken };
}

export async function revokeAllSessions(userId: string): Promise<void> {
  if (!redisClient) return;
  await connectRedis();

  for await (const key of redisClient.scanIterator({ MATCH: `${REFRESH_TOKEN_PREFIX}*`, COUNT: 100 })) {
    const serialized = await redisClient.get(key);
    if (!serialized) continue;
    try {
      const session = JSON.parse(serialized) as RefreshSession;
      if (session.userId === userId) await redisClient.del(key);
    } catch {
      await redisClient.del(key);
    }
  }
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
