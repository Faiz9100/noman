import dotenv from "dotenv";

dotenv.config();

/**
 * Centralized, typed access to environment variables.
 * Import this instead of reading `process.env` directly anywhere else
 * in the codebase, so every required variable is validated in one place.
 */
function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const clientUrlRaw = required("CLIENT_URL", "http://localhost:5173");

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 5000),

  /** The first configured origin — used anywhere only a single URL makes sense (e.g. links in emails). */
  clientUrl: clientUrlRaw.split(",")[0].trim(),
  /** Every allowed origin (comma-separated in CLIENT_URL) — e.g. local dev + a deployed Vercel URL at once. */
  clientUrls: clientUrlRaw.split(",").map((url) => url.trim()).filter(Boolean),

  mongoUri: required("MONGO_URI", "mongodb://127.0.0.1:27017/cricket-auction"),

  jwtSecret: required("JWT_SECRET", "dev_only_secret_change_me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  cookieName: process.env.COOKIE_NAME ?? "cricket_auction_token",

  maxUploadSizeMb: Number(process.env.MAX_UPLOAD_SIZE_MB ?? 5),

  isProduction: (process.env.NODE_ENV ?? "development") === "production",

  // Used only by `npm run seed` to create/update the first admin account.
  seedAdminName: process.env.SEED_ADMIN_NAME ?? "Match Day Admin",
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL ?? "admin@auctionnight.com",
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? "Admin@123",
};

// Matches http(s)://<private-LAN-IP>:<any-port> — e.g. http://192.168.1.4:5173.
// Lets a phone/tablet on the same Wi-Fi reach the dev server via the
// machine's LAN IP without editing CLIENT_URL every time that IP changes
// (a new network, a router reassigning DHCP leases, etc).
const LAN_ORIGIN_PATTERN =
  /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

/**
 * Single source of truth for "is this browser origin allowed to talk to the
 * API" — used by both the REST CORS middleware and the Socket.io CORS config
 * so they can never drift apart. In production only the explicit CLIENT_URL
 * allowlist is honored; the LAN pattern is dev-only.
 */
export function isAllowedOrigin(origin: string): boolean {
  return env.clientUrls.includes(origin) || (!env.isProduction && LAN_ORIGIN_PATTERN.test(origin));
}
