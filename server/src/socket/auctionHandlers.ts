import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Admin, IAdmin } from "../models/Admin";
import { ApiError } from "../middleware/errorMiddleware";
import { SOCKET_EVENTS } from "./ioInstance";
import * as auctionService from "../services/auctionService";

interface AuthedSocket extends Socket {
  data: { admin?: IAdmin };
}

type Ack = (response: { success: boolean; message?: string; data?: unknown }) => void;

function extractCookieToken(socket: Socket): string | undefined {
  const cookieHeader = socket.handshake.headers.cookie;
  if (!cookieHeader) return undefined;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${env.cookieName}=`));
  return match ? decodeURIComponent(match.slice(match.indexOf("=") + 1)) : undefined;
}

/**
 * Verifies whatever JWT the socket brought (handshake `auth.token`, or the
 * auth cookie) and attaches the admin if valid. A socket with no/invalid
 * token is still allowed to connect — read-only clients like the
 * projector screen never log in, they just can't call control actions.
 */
async function authenticateSocket(socket: Socket): Promise<IAdmin | undefined> {
  const token = (socket.handshake.auth?.token as string | undefined) || extractCookieToken(socket);
  if (!token) return undefined;

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { id: string };
    return (await Admin.findById(decoded.id)) ?? undefined;
  } catch {
    return undefined;
  }
}

function requireAdmin(socket: AuthedSocket, ack?: Ack): IAdmin | null {
  if (socket.data.admin) return socket.data.admin;
  ack?.({ success: false, message: "Not authorized — admin login required" });
  return null;
}

function requireString(payload: unknown, field: string): string {
  const value = (payload as Record<string, unknown> | undefined)?.[field];
  if (typeof value !== "string" || !value) {
    throw new ApiError(400, `${field} is required`);
  }
  return value;
}

function optionalNumber(payload: unknown, field: string): number | undefined {
  const value = (payload as Record<string, unknown> | undefined)?.[field];
  return typeof value === "number" ? value : undefined;
}

/** Wraps a handler so thrown ApiErrors become a clean `ack({ success:false, message })` instead of crashing the socket. */
function safe(handler: (payload: unknown, ack?: Ack) => Promise<void>) {
  return async (payload: unknown, ack?: Ack) => {
    try {
      await handler(payload, ack);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Something went wrong";
      if (typeof ack === "function") {
        ack({ success: false, message });
      } else {
        console.error("[socket] unhandled action error:", error);
      }
    }
  };
}

export function registerAuctionHandlers(io: SocketIOServer): void {
  io.use(async (socket, next) => {
    (socket as AuthedSocket).data.admin = await authenticateSocket(socket);
    next();
  });

  io.on(SOCKET_EVENTS.CONNECTION, (socket: AuthedSocket) => {
    socket.on(
      SOCKET_EVENTS.JOIN_AUCTION_ROOM,
      safe(async (payload) => {
        const auctionId = requireString(payload, "auctionId");
        socket.join(auctionId);
        const state = await auctionService.getAuction(auctionId);
        socket.emit(SOCKET_EVENTS.STATE_SYNC, state);
      })
    );

    socket.on(SOCKET_EVENTS.LEAVE_AUCTION_ROOM, (payload: { auctionId?: string }) => {
      if (payload?.auctionId) socket.leave(payload.auctionId);
    });

    socket.on(
      SOCKET_EVENTS.ACTION_START_AUCTION,
      safe(async (payload, ack) => {
        if (!requireAdmin(socket, ack)) return;
        const auctionId = requireString(payload, "auctionId");
        const data = await auctionService.startAuction(auctionId);
        ack?.({ success: true, data });
      })
    );

    socket.on(
      SOCKET_EVENTS.ACTION_TIMER_PAUSE,
      safe(async (payload, ack) => {
        if (!requireAdmin(socket, ack)) return;
        const data = await auctionService.pauseLotTimer(requireString(payload, "auctionId"));
        ack?.({ success: true, data });
      })
    );

    socket.on(
      SOCKET_EVENTS.ACTION_TIMER_RESUME,
      safe(async (payload, ack) => {
        if (!requireAdmin(socket, ack)) return;
        const data = await auctionService.resumeLotTimer(requireString(payload, "auctionId"));
        ack?.({ success: true, data });
      })
    );

    socket.on(
      SOCKET_EVENTS.ACTION_TIMER_RESET,
      safe(async (payload, ack) => {
        if (!requireAdmin(socket, ack)) return;
        const data = await auctionService.resetLotTimer(requireString(payload, "auctionId"));
        ack?.({ success: true, data });
      })
    );

    socket.on(
      SOCKET_EVENTS.ACTION_BID_INCREASE,
      safe(async (payload, ack) => {
        if (!requireAdmin(socket, ack)) return;
        const auctionId = requireString(payload, "auctionId");
        const data = await auctionService.increaseBid(auctionId, optionalNumber(payload, "amount"));
        ack?.({ success: true, data });
      })
    );

    socket.on(
      SOCKET_EVENTS.ACTION_BID_DECREASE,
      safe(async (payload, ack) => {
        if (!requireAdmin(socket, ack)) return;
        const auctionId = requireString(payload, "auctionId");
        const data = await auctionService.decreaseBid(auctionId, optionalNumber(payload, "amount"));
        ack?.({ success: true, data });
      })
    );

    socket.on(
      SOCKET_EVENTS.ACTION_SELECT_TEAM,
      safe(async (payload, ack) => {
        const admin = requireAdmin(socket, ack);
        if (!admin) return;
        const auctionId = requireString(payload, "auctionId");
        const teamId = requireString(payload, "teamId");
        const data = await auctionService.selectTeam(auctionId, teamId, admin.id);
        ack?.({ success: true, data });
      })
    );

    socket.on(
      SOCKET_EVENTS.ACTION_LOT_SOLD,
      safe(async (payload, ack) => {
        const admin = requireAdmin(socket, ack);
        if (!admin) return;
        const data = await auctionService.markSold(requireString(payload, "auctionId"), admin.id);
        ack?.({ success: true, data });
      })
    );

    socket.on(
      SOCKET_EVENTS.ACTION_LOT_UNSOLD,
      safe(async (payload, ack) => {
        const admin = requireAdmin(socket, ack);
        if (!admin) return;
        const data = await auctionService.markUnsold(requireString(payload, "auctionId"), admin.id);
        ack?.({ success: true, data });
      })
    );

    socket.on(
      SOCKET_EVENTS.ACTION_NEXT_LOT,
      safe(async (payload, ack) => {
        if (!requireAdmin(socket, ack)) return;
        const data = await auctionService.nextLot(requireString(payload, "auctionId"));
        ack?.({ success: true, data });
      })
    );

    socket.on(
      SOCKET_EVENTS.ACTION_BIDDING_OPEN,
      safe(async (payload, ack) => {
        if (!requireAdmin(socket, ack)) return;
        const data = await auctionService.openBidding(requireString(payload, "auctionId"));
        ack?.({ success: true, data });
      })
    );

    socket.on(
      SOCKET_EVENTS.ACTION_BIDDING_CLOSE,
      safe(async (payload, ack) => {
        if (!requireAdmin(socket, ack)) return;
        const data = await auctionService.closeBidding(requireString(payload, "auctionId"));
        ack?.({ success: true, data });
      })
    );
  });
}
