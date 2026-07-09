import { SOCKET_URL } from "./constants";

/**
 * Formats a raw bid/price/budget amount, e.g. 12500 -> "₹12,500". Every
 * number in this app is admin-entered with no fixed scale (no forced
 * Lakh/Crore units) — this always shows the exact figure, just grouped
 * for readability.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Builds initials from a full name, e.g. "Virat Kohli" -> "VK" */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** Joins class names conditionally, skipping falsy values. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Resolves an uploaded file's server-relative path (e.g. "/uploads/x.jpg") to
 * a full URL against the API's origin. Reuses SOCKET_URL (same origin the
 * socket connects to) as the single source of truth for "where the backend
 * lives" — previously this re-read VITE_SOCKET_URL independently with its
 * own hardcoded `localhost:5000` fallback, which silently broke every image
 * on any device other than the exact dev machine (a phone on the same
 * Wi-Fi, a teammate's laptop) and in production whenever the env var wasn't
 * set, since the browser would try to load images from its own localhost.
 * A Cloudinary (or any other absolute) URL already starts with http(s):// and
 * passes through untouched.
 */
export function resolveUploadUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return `${SOCKET_URL}${path}`;
}

/** Lightens (positive percent) or darkens (negative) a "#rrggbb" hex color. */
export function shadeColor(hex: string, percent: number): string {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.max(0, Math.min(255, (num >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** A two-tone diagonal gradient for a team's brand color, falling back to the house gold if unset. */
export function teamGradientStyle(color?: string): { background: string } {
  const base = color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#D4AF37";
  return { background: `linear-gradient(135deg, ${shadeColor(base, 15)}, ${shadeColor(base, -25)})` };
}
