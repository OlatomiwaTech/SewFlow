import type { Request, Response, NextFunction } from "express";
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
} from "../validators/auth.validator.js";
import * as authService from "../services/auth.service.js";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = registerSchema.parse(req.body);

    const result = await authService.register(input);

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = loginSchema.parse(req.body);

    const result = await authService.login(input);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
    }

    const result = await authService.getCurrentUser(
      req.user.id,
      req.user.businessId,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const result = await authService.refresh(refreshToken);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function revokeSessions(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: "Authentication required." });
    await authService.revokeAllSessions(req.user.id);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}