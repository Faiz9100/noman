import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { isAllowedOrigin } from "../config/env";

/**
 * Socket.io event names shared by the server and (by convention, copied
 * exactly) the client. There is no shared package between the two apps,
 * so these strings must be kept in sync by hand.
 */
export const SOCKET_EVENTS = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",

  // Room membership
  JOIN_AUCTION_ROOM: "auction:join",
  LEAVE_AUCTION_ROOM: "auction:leave",

  // Sent only to the joining socket, right after it joins a room —
  // a full snapshot so a fresh/reconnecting client never needs a page reload.
  STATE_SYNC: "state:sync",

  // Admin -> server (control actions)
  ACTION_START_AUCTION: "auction:start",
  ACTION_TIMER_PAUSE: "timer:pause",
  ACTION_TIMER_RESUME: "timer:resume",
  ACTION_TIMER_RESET: "timer:reset",
  ACTION_BID_INCREASE: "bid:increase",
  ACTION_BID_DECREASE: "bid:decrease",
  ACTION_SELECT_TEAM: "team:select",
  ACTION_LOT_SOLD: "lot:sold",
  ACTION_LOT_UNSOLD: "lot:unsold",
  ACTION_NEXT_LOT: "lot:next",
  ACTION_BIDDING_OPEN: "bidding:open",
  ACTION_BIDDING_CLOSE: "bidding:close",

  // Server -> room (broadcasts)
  AUCTION_STATUS_CHANGED: "auction:status-changed",
  AUCTION_COMPLETED: "auction:completed",
  AUCTION_CLOSED: "auction:closed",
  AUCTION_RESET: "auction:reset",
  AUCTION_ROUND_ADVANCED: "auction:round-advanced",
  LOT_CHANGED: "auction:lot-changed",
  LOT_CLOSED: "auction:lot-closed",
  TIMER_UPDATE: "timer:update",
  BID_UPDATED: "bid:updated",
  BID_PLACED: "auction:bid-placed",
  BIDDING_CHANGED: "bidding:changed",

  // Global (not auction-room-scoped) — lets Live Auction / Projector patch a
  // player's photo (or any field) in place if the admin edits it while that
  // player happens to be the active lot, without waiting for the next lot change.
  PLAYER_UPDATED: "player:updated",
} as const;

let io: SocketIOServer | null = null;

/** Initializes Socket.io on top of the given HTTP server. */
export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Non-browser clients send no Origin header (e.g. a bare websocket test tool).
        if (!origin || isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} is not allowed by CORS`));
        }
      },
      credentials: true,
    },
  });
  return io;
}

/** Access the initialized Socket.io instance from anywhere in the server. */
export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.io has not been initialized yet. Call initSocket() first.");
  }
  return io;
}

/**
 * Emits an auction-scoped event to every client in that auction's room.
 * Safe to call even if Socket.io failed to initialize (e.g. in a script
 * or test context) — it logs and no-ops instead of throwing, since
 * real-time sync is a bonus, not a requirement, for any given request.
 */
export function emitToAuction(auctionId: string, event: string, payload: unknown): void {
  try {
    getIO().to(auctionId).emit(event, payload);
  } catch {
    // Socket.io not initialized (e.g. running outside the HTTP server) — ignore.
  }
}

/** Emits to every connected client regardless of room — for updates (like a player edit) that aren't scoped to one auction. */
export function emitGlobal(event: string, payload: unknown): void {
  try {
    getIO().emit(event, payload);
  } catch {
    // Socket.io not initialized (e.g. running outside the HTTP server) — ignore.
  }
}
