export const APP_NAME = import.meta.env.VITE_APP_NAME || "Auction Night";

/**
 * Defaults to a same-origin relative path (proxied by Vite in dev, see
 * vite.config.ts) instead of a hardcoded `localhost`. That makes the app
 * work unmodified when opened from a phone/tablet on the same Wi-Fi via
 * the dev machine's LAN IP — a hardcoded `localhost` would otherwise
 * resolve to the phone itself and fail with a network error. Production
 * builds should still set VITE_API_BASE_URL to the deployed API's URL.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

/** Matches the server's MAX_UPLOAD_SIZE_MB default (server/.env) — lets the upload form reject an oversized file instantly instead of waiting on a round trip. */
export const MAX_UPLOAD_SIZE_MB = Number(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB) || 5;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;

export const ROUTES = {
  HOME: "/",
  ADMIN_LOGIN: "/admin/login",
  DASHBOARD: "/dashboard",
  TEAMS: "/dashboard/teams",
  TEAM_DETAIL: "/dashboard/teams/:id",
  PLAYERS: "/dashboard/players",
  LIVE_AUCTION: "/dashboard/live",
  AUCTION_HISTORY: "/dashboard/history",
  SETTINGS: "/dashboard/settings",
  PROJECTOR: "/projector",
  NOT_FOUND: "*",
} as const;

export const PLAYER_ROLES = ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"] as const;

export const PLAYER_STATUSES = ["Available", "Sold", "Unsold"] as const;
