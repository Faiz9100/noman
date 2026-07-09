import { connectDB } from "../config/db";
import { env } from "../config/env";
import { Admin } from "../models/Admin";
import mongoose from "mongoose";

/**
 * Creates (or updates the password of) the initial admin account from
 * env vars. There is no public registration endpoint — this is the only
 * way to get the first admin into the database.
 *
 *   npm run seed
 */
async function seed() {
  await connectDB();

  const existing = await Admin.findOne({ email: env.seedAdminEmail }).select("+password");

  if (existing) {
    existing.name = env.seedAdminName;
    existing.password = env.seedAdminPassword;
    await existing.save();
    console.log(`[seed] Updated existing admin: ${existing.email}`);
  } else {
    const admin = await Admin.create({
      name: env.seedAdminName,
      email: env.seedAdminEmail,
      password: env.seedAdminPassword,
      role: "superadmin",
    });
    console.log(`[seed] Created admin: ${admin.email}`);
  }

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((error) => {
  console.error("[seed] Failed:", error);
  process.exit(1);
});
