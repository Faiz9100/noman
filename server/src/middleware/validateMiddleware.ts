import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { ApiError } from "./errorMiddleware";

/**
 * Runs after an array of express-validator rules. Collects any failures
 * and rejects with a single 400 listing every invalid field, instead of
 * letting bad input reach a controller.
 */
export function validateRequest(req: Request, _res: Response, next: NextFunction) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array({ onlyFirstError: true }).map((err) => ({
    field: err.type === "field" ? err.path : err.type,
    message: err.msg,
  }));

  next(new ApiError(400, "Validation failed", errors));
}
