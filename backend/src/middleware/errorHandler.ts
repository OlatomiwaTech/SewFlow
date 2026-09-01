import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  res.status(404).json({
    success: false,
    error: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: "Validation failed.",
      details: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  if (err.name === "CONFLICT") {
    res.status(409).json({
      success: false,
      error: err.message,
    });
    return;
  }

  if (err.name === "UNAUTHORIZED") {
    res.status(401).json({
      success: false,
      error: err.message,
    });
    return;
  }

  if (err.name === "NOT_FOUND") {
    res.status(404).json({
      success: false,
      error: err.message,
    });
    return;
  }

  if (process.env.NODE_ENV === "development") {
    console.error("[Unhandled Error]:", err);
  }

  res.status(500).json({
    success: false,
    error: "Internal server error.",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
