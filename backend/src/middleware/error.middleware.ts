import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: "Validation failed.",
      details: error.flatten().fieldErrors,
    });
  }

  if (error instanceof Error && error.name === "CONFLICT") {
    return res.status(409).json({
      success: false,
      error: error.message,
    });
  }

  if (error instanceof Error && error.name === "UNAUTHORIZED") {
    return res.status(401).json({
      success: false,
      error: error.message,
    });
  }

  console.error(error);

  return res.status(500).json({
    success: false,
    error: "Internal server error.",
  });
};