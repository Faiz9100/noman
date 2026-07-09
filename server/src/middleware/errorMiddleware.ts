import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { MulterError } from "multer";
import { env } from "../config/env";

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  statusCode: number;
  errors?: FieldError[];

  constructor(statusCode: number, message: string, errors?: FieldError[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** Catches requests to routes that don't exist. */
export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
}

/**
 * Normalizes well-known Mongoose error shapes (bad ObjectId, schema
 * validation, unique index violations) into an ApiError so the response
 * body is always the same predictable JSON shape, regardless of what
 * threw.
 */
function normalize(err: Error | ApiError): ApiError {
  if (err instanceof ApiError) return err;

  if (err instanceof mongoose.Error.CastError) {
    return new ApiError(400, `Invalid value for field "${err.path}": ${err.value}`);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors: FieldError[] = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return new ApiError(400, "Validation failed", errors);
  }

  if ((err as { code?: number }).code === 11000) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue ?? {};
    const [field] = Object.keys(keyValue);
    return new ApiError(
      409,
      field ? `A record with this ${field} already exists` : "Duplicate value violates a unique constraint",
      field ? [{ field, message: "Must be unique" }] : undefined
    );
  }

  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return new ApiError(400, `Image is too large — the maximum allowed size is ${env.maxUploadSizeMb}MB`);
    }
    return new ApiError(400, `Upload failed: ${err.message}`);
  }

  if (err.name === "JsonWebTokenError") {
    return new ApiError(401, "Invalid authentication token");
  }

  if (err.name === "TokenExpiredError") {
    return new ApiError(401, "Authentication token has expired");
  }

  return new ApiError(500, err.message || "Internal Server Error");
}

/** Final error handler. Must be registered last, after all routes. */
export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  const normalized = normalize(err);

  if (!env.isProduction && normalized.statusCode >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(normalized.statusCode).json({
    success: false,
    message: normalized.message,
    ...(normalized.errors ? { errors: normalized.errors } : {}),
    ...(env.isProduction ? {} : { stack: err.stack }),
  });
}
