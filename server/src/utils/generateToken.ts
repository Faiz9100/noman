import jwt from "jsonwebtoken";
import { Response } from "express";
import { env } from "../config/env";

/**
 * Signs a JWT for the given user id and sets it as an httpOnly cookie
 * on the response. Returns the raw token as well, for clients that
 * prefer the Authorization header flow (e.g. mobile clients).
 */
export function generateToken(res: Response, userId: string): string {
  const token = jwt.sign({ id: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);

  res.cookie(env.cookieName, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
}
