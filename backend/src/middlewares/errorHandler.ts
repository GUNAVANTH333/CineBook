import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";

/**
 * Centralized error handler middleware.
 * Must be registered as the last middleware in app.ts.
 *
 * - AppError subclasses → deterministic HTTP status + structured JSON
 * - Unknown errors (bugs, library throws) → 500 in production (details in dev)
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isDev = env.NODE_ENV === "development";

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      // Attach field-level validation errors if present (ValidationError)
      ...(("errors" in err && err.errors) ? { errors: err.errors } : {}),
      ...(isDev ? { stack: err.stack } : {}),
    });
    return;
  }

  const code = (err as { code?: unknown }).code;
  if (typeof code === "string") {
    if (code === "P2003") {
      res.status(409).json({
        success: false,
        message: "Cannot delete: this record is still referenced by related data.",
        ...(isDev ? { stack: err.stack } : {}),
      });
      return;
    }
    if (code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Record not found.",
        ...(isDev ? { stack: err.stack } : {}),
      });
      return;
    }
  }

  // Unhandled / programmer errors
  console.error("[Unhandled Error]", err);

  res.status(500).json({
    success: false,
    message: isDev ? err.message : "Internal server error",
    ...(isDev ? { stack: err.stack } : {}),
  });
};

/**
 * 404 handler — catches routes that were never matched.
 * Register this BEFORE errorHandler but AFTER all routes.
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
};
