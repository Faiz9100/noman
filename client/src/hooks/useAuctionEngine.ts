import { useCallback, useEffect, useRef, useState } from "react";
import { socket, connectSocket } from "../services/socket";
import { auctionService } from "../services/auctionService";
import { Auction, EngineBid, LotClosedPayload, LotPlayer, SocketAck } from "../types";

const EVENTS = {
  JOIN: "auction:join",
  LEAVE: "auction:leave",
  STATE_SYNC: "state:sync",

  START: "auction:start",
  TIMER_PAUSE: "timer:pause",
  TIMER_RESUME: "timer:resume",
  TIMER_RESET: "timer:reset",
  BID_INCREASE: "bid:increase",
  BID_DECREASE: "bid:decrease",
  SELECT_TEAM: "team:select",
  LOT_SOLD: "lot:sold",
  LOT_UNSOLD: "lot:unsold",
  NEXT_LOT: "lot:next",
  BIDDING_OPEN: "bidding:open",
  BIDDING_CLOSE: "bidding:close",

  STATUS_CHANGED: "auction:status-changed",
  COMPLETED: "auction:completed",
  CLOSED: "auction:closed",
  RESET: "auction:reset",
  ROUND_ADVANCED: "auction:round-advanced",
  LOT_CHANGED: "auction:lot-changed",
  LOT_CLOSED: "auction:lot-closed",
  TIMER_UPDATE: "timer:update",
  BID_UPDATED: "bid:updated",
  BID_PLACED: "auction:bid-placed",
  BIDDING_CHANGED: "bidding:changed",
  PLAYER_UPDATED: "player:updated",
} as const;

const LOT_CLOSED_DISPLAY_MS = 4000;

interface AuctionBidPlacedPayload {
  currentBid: number;
  leadingTeam: { id: string; name: string; shortName: string };
  bid: EngineBid;
}

/**
 * Owns the live connection to one auction's Socket.io room: joins on
 * mount, keeps `auction` in sync with every server broadcast, and exposes
 * promise-wrapped action dispatchers for the admin control room. Read-only
 * consumers (the projector screen) can use the same hook and simply never
 * call the action dispatchers.
 */
export function useAuctionEngine(auctionId: string | null) {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bidLog, setBidLog] = useState<EngineBid[]>([]);
  const [lotClosed, setLotClosed] = useState<LotClosedPayload | null>(null);
  const [roundAdvanced, setRoundAdvanced] = useState<{ round: number; requeuedCount: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(socket.connected);
  const lotClosedTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!auctionId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    connectSocket();

    const join = () => socket.emit(EVENTS.JOIN, { auctionId });

    const onConnect = () => {
      setConnected(true);
      join();
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = () => setError("Could not reach the auction server");

    const onStateSync = (payload: Auction) => {
      setAuction(payload);
      setIsLoading(false);
    };

    const onLotChanged = (payload: Auction) => {
      setAuction(payload);
      setBidLog([]);
      setLotClosed(null);
      if (lotClosedTimeout.current) clearTimeout(lotClosedTimeout.current);
    };

    const onStatusChanged = (payload: { status: Auction["status"] }) => {
      setAuction((prev) => (prev ? { ...prev, status: payload.status } : prev));
    };

    const onCompleted = () => {
      setAuction((prev) => (prev ? { ...prev, status: "completed", currentPlayer: null, leadingTeam: null } : prev));
    };

    const onClosed = () => {
      setAuction((prev) => (prev ? { ...prev, status: "closed", currentPlayer: null, leadingTeam: null } : prev));
    };

    const onTimerUpdate = (payload: Auction["timer"]) => {
      setAuction((prev) => (prev ? { ...prev, timer: payload } : prev));
    };

    const onBidUpdated = (payload: { currentBid: number }) => {
      setAuction((prev) => (prev ? { ...prev, currentBid: payload.currentBid } : prev));
    };

    const onBidPlaced = (payload: AuctionBidPlacedPayload) => {
      setAuction((prev) =>
        prev
          ? {
              ...prev,
              currentBid: payload.currentBid,
              leadingTeam: {
                _id: payload.leadingTeam.id,
                name: payload.leadingTeam.name,
                shortName: payload.leadingTeam.shortName,
                purseRemaining: prev.leadingTeam?.purseRemaining ?? 0,
              },
            }
          : prev
      );
      setBidLog((prev) => [payload.bid, ...prev].slice(0, 20));
    };

    const onLotClosed = (payload: LotClosedPayload) => {
      setLotClosed(payload);
      if (lotClosedTimeout.current) clearTimeout(lotClosedTimeout.current);
      lotClosedTimeout.current = setTimeout(() => setLotClosed(null), LOT_CLOSED_DISPLAY_MS);
    };

    const onBiddingChanged = (payload: { biddingOpen: boolean }) => {
      setAuction((prev) => (prev ? { ...prev, biddingOpen: payload.biddingOpen } : prev));
    };

    const onRoundAdvanced = (payload: { round: number; requeuedCount: number }) => {
      setAuction((prev) => (prev ? { ...prev, currentRound: payload.round } : prev));
      setRoundAdvanced(payload);
      setTimeout(() => setRoundAdvanced(null), LOT_CLOSED_DISPLAY_MS);
    };

    const onReset = () => {
      setBidLog([]);
      setLotClosed(null);
      if (lotClosedTimeout.current) clearTimeout(lotClosedTimeout.current);
      auctionService.getById(auctionId).then(setAuction).catch(() => undefined);
    };

    // Patches the active lot's player in place (e.g. an image fix mid-auction)
    // without waiting for the next lot-changed broadcast to re-populate it.
    const onPlayerUpdated = (payload: { player: LotPlayer }) => {
      setAuction((prev) =>
        prev && prev.currentPlayer && prev.currentPlayer._id === payload.player._id
          ? { ...prev, currentPlayer: payload.player }
          : prev
      );
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on(EVENTS.STATE_SYNC, onStateSync);
    socket.on(EVENTS.LOT_CHANGED, onLotChanged);
    socket.on(EVENTS.STATUS_CHANGED, onStatusChanged);
    socket.on(EVENTS.COMPLETED, onCompleted);
    socket.on(EVENTS.CLOSED, onClosed);
    socket.on(EVENTS.RESET, onReset);
    socket.on(EVENTS.ROUND_ADVANCED, onRoundAdvanced);
    socket.on(EVENTS.PLAYER_UPDATED, onPlayerUpdated);
    socket.on(EVENTS.TIMER_UPDATE, onTimerUpdate);
    socket.on(EVENTS.BID_UPDATED, onBidUpdated);
    socket.on(EVENTS.BID_PLACED, onBidPlaced);
    socket.on(EVENTS.LOT_CLOSED, onLotClosed);
    socket.on(EVENTS.BIDDING_CHANGED, onBiddingChanged);

    if (socket.connected) join();

    // Also seed from REST in case the socket takes a moment (or fails) to connect.
    auctionService
      .getById(auctionId)
      .then((data) => setAuction((prev) => prev ?? data))
      .catch(() => setError("Could not load the auction"))
      .finally(() => setIsLoading(false));

    return () => {
      socket.emit(EVENTS.LEAVE, { auctionId });
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off(EVENTS.STATE_SYNC, onStateSync);
      socket.off(EVENTS.LOT_CHANGED, onLotChanged);
      socket.off(EVENTS.STATUS_CHANGED, onStatusChanged);
      socket.off(EVENTS.COMPLETED, onCompleted);
      socket.off(EVENTS.CLOSED, onClosed);
      socket.off(EVENTS.RESET, onReset);
      socket.off(EVENTS.ROUND_ADVANCED, onRoundAdvanced);
      socket.off(EVENTS.PLAYER_UPDATED, onPlayerUpdated);
      socket.off(EVENTS.TIMER_UPDATE, onTimerUpdate);
      socket.off(EVENTS.BID_UPDATED, onBidUpdated);
      socket.off(EVENTS.BID_PLACED, onBidPlaced);
      socket.off(EVENTS.LOT_CLOSED, onLotClosed);
      socket.off(EVENTS.BIDDING_CHANGED, onBiddingChanged);
      if (lotClosedTimeout.current) clearTimeout(lotClosedTimeout.current);
    };
  }, [auctionId]);

  const emitAction = useCallback(
    <T = unknown>(event: string, payload: Record<string, unknown> = {}): Promise<SocketAck<T>> => {
      if (!auctionId) return Promise.resolve({ success: false, message: "No auction selected" });
      return new Promise((resolve) => {
        socket
          .timeout(6000)
          .emit(event, { auctionId, ...payload }, (err: Error | null, ack: SocketAck<T>) => {
            if (err) {
              resolve({ success: false, message: "The server didn't respond in time" });
              return;
            }
            resolve(ack);
          });
      });
    },
    [auctionId]
  );

  return {
    auction,
    bidLog,
    lotClosed,
    roundAdvanced,
    isLoading,
    error,
    connected,
    actions: {
      start: () => emitAction(EVENTS.START),
      pauseTimer: () => emitAction(EVENTS.TIMER_PAUSE),
      resumeTimer: () => emitAction(EVENTS.TIMER_RESUME),
      resetTimer: () => emitAction(EVENTS.TIMER_RESET),
      increaseBid: (amount?: number) => emitAction(EVENTS.BID_INCREASE, { amount }),
      decreaseBid: (amount?: number) => emitAction(EVENTS.BID_DECREASE, { amount }),
      selectTeam: (teamId: string) => emitAction(EVENTS.SELECT_TEAM, { teamId }),
      markSold: () => emitAction(EVENTS.LOT_SOLD),
      markUnsold: () => emitAction(EVENTS.LOT_UNSOLD),
      nextLot: () => emitAction(EVENTS.NEXT_LOT),
      openBidding: () => emitAction(EVENTS.BIDDING_OPEN),
      closeBidding: () => emitAction(EVENTS.BIDDING_CLOSE),
    },
  };
}
