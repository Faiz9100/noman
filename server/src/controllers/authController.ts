import { Response } from "express";
import asyncHandler from "express-async-handler";
import { Admin } from "../models/Admin";
import { ApiError } from "../middleware/errorMiddleware";
import { generateToken } from "../utils/generateToken";
import { AuthRequest } from "../middleware/authMiddleware";
import { env } from "../config/env";

/**
 * @route POST /api/auth/register
 * Protected + admin-only: there is no public sign-up, an existing admin
 * creates further admin accounts.
 */
export const registerAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password, role } = req.body;

  const existing = await Admin.findOne({ email });
  if (existing) {
    throw new ApiError(409, "An admin account with this email already exists");
  }

  const admin = await Admin.create({ name, email, password, role });

  res.status(201).json({
    success: true,
    message: "Admin account created",
    data: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
});

/** @route POST /api/auth/login */
export const loginAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email }).select("+password");
  if (!admin || !(await admin.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken(res, admin.id);

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    data: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    token,
  });
});

/** @route POST /api/auth/logout */
export const logoutAdmin = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.clearCookie(env.cookieName);
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

/** @route GET /api/auth/me */
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Not authorized");
  }
  const { id, name, email, role } = req.user;
  res.status(200).json({ success: true, data: { id, name, email, role } });
});

/**
 * @route PUT /api/auth/profile
 * Lets the signed-in admin change their own name/email. Requires the
 * current password so a hijacked, still-logged-in session (e.g. an
 * unlocked laptop left at the auction desk) can't silently take over the
 * account by changing the email to one an attacker controls.
 */
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, "Not authorized");

  const { name, email, currentPassword } = req.body;

  const admin = await Admin.findById(req.user.id).select("+password");
  if (!admin) throw new ApiError(404, "Account no longer exists");

  if (!(await admin.comparePassword(currentPassword))) {
    throw new ApiError(401, "Current password is incorrect");
  }

  if (email && email.toLowerCase() !== admin.email) {
    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) throw new ApiError(409, "An admin account with this email already exists");
    admin.email = email;
  }
  if (name) admin.name = name;

  await admin.save();

  res.status(200).json({
    success: true,
    message: "Profile updated",
    data: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
});

/**
 * @route PUT /api/auth/password
 * Changes the signed-in admin's password. Requires the current password;
 * hashing is handled by the Admin model's pre-save hook.
 */
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new ApiError(401, "Not authorized");

  const { currentPassword, newPassword } = req.body;

  const admin = await Admin.findById(req.user.id).select("+password");
  if (!admin) throw new ApiError(404, "Account no longer exists");

  if (!(await admin.comparePassword(currentPassword))) {
    throw new ApiError(401, "Current password is incorrect");
  }

  admin.password = newPassword;
  await admin.save();

  res.status(200).json({ success: true, message: "Password changed successfully" });
});
