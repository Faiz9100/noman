import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { env } from "../config/env";
import { Admin, IAdmin, AdminRole } from "../models/Admin";
import { ApiError } from "./errorMiddleware";

export interface AuthRequest extends Request {
  user?: IAdmin;
}

interface JwtPayload {
  id: string;
}

/** Verifies the JWT (from cookie or Authorization header) and attaches the admin to the request. */
export const protect = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies?.[env.cookieName]) {
      token = req.cookies[env.cookieName];
    }

    if (!token) {
      throw new ApiError(401, "Not authorized, no token provided");
    }

    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const user = await Admin.findById(decoded.id);
    if (!user) {
      throw new ApiError(401, "Not authorized, admin account no longer exists");
    }
    req.user = user;
    next();
  }
);

/** Restricts access to the given roles. Use after `protect`. */
export function authorize(...roles: AdminRole[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, "You do not have permission to perform this action");
    }
    next();
  };
}
