import { emitToAuction, SOCKET_EVENTS } from "./ioInstance";

export type TimerStatus = "idle" | "running" | "paused" | "expired";

export interface TimerSnapshot {
  total: number;
  remaining: number;
  status: TimerStatus;
}

interface TimerState extends TimerSnapshot {
  handle?: ReturnType<typeof setInterval>;
}

/**
 * The countdown clock for each live auction's current lot. Deliberately
 * pure in-memory (not persisted) — it ticks once a second and broadcasts
 * to the auction's room, which is simpler and drift-free compared to
 * having every connected client run its own timer. The tradeoff is that
 * a server restart loses the exact second remaining on a live lot, which
 * is an acceptable, known limitation at this scale.
 */
const timers = new Map<string, TimerState>();

function broadcast(auctionId: string, state: TimerState): void {
  emitToAuction(auctionId, SOCKET_EVENTS.TIMER_UPDATE, {
    total: state.total,
    remaining: state.remaining,
    status: state.status,
  });
}

function tick(auctionId: string): void {
  const state = timers.get(auctionId);
  if (!state || state.status !== "running") return;

  state.remaining -= 1;
  if (state.remaining <= 0) {
    state.remaining = 0;
    state.status = "expired";
    if (state.handle) clearInterval(state.handle);
    state.handle = undefined;
  }
  broadcast(auctionId, state);
}

/** Starts a fresh countdown for a lot, replacing any prior timer for this auction. */
export function startTimer(auctionId: string, seconds: number): TimerSnapshot {
  stopTimer(auctionId);
  const state: TimerState = { total: seconds, remaining: seconds, status: "running" };
  state.handle = setInterval(() => tick(auctionId), 1000);
  timers.set(auctionId, state);
  broadcast(auctionId, state);
  return { total: state.total, remaining: state.remaining, status: state.status };
}

/** Freezes the countdown where it stands. No-op if not currently running. */
export function pauseTimer(auctionId: string): TimerSnapshot | null {
  const state = timers.get(auctionId);
  if (!state || state.status !== "running") return state ? { ...state } : null;

  if (state.handle) clearInterval(state.handle);
  state.handle = undefined;
  state.status = "paused";
  broadcast(auctionId, state);
  return { total: state.total, remaining: state.remaining, status: state.status };
}

/** Continues a paused countdown from where it left off. No-op if not currently paused. */
export function resumeTimer(auctionId: string): TimerSnapshot | null {
  const state = timers.get(auctionId);
  if (!state || state.status !== "paused") return state ? { ...state } : null;

  state.status = "running";
  state.handle = setInterval(() => tick(auctionId), 1000);
  broadcast(auctionId, state);
  return { total: state.total, remaining: state.remaining, status: state.status };
}

/** Restarts the countdown at full duration, preserving whether it was running or paused. */
export function resetTimer(auctionId: string, seconds?: number): TimerSnapshot | null {
  const state = timers.get(auctionId);
  if (!state) return null;

  const wasRunning = state.status === "running";
  if (state.handle) clearInterval(state.handle);
  state.handle = undefined;
  state.total = seconds ?? state.total;
  state.remaining = state.total;
  state.status = wasRunning ? "running" : "paused";
  if (wasRunning) state.handle = setInterval(() => tick(auctionId), 1000);
  broadcast(auctionId, state);
  return { total: state.total, remaining: state.remaining, status: state.status };
}

/** Clears the timer entirely (lot resolved, auction ended, etc). */
export function stopTimer(auctionId: string): void {
  const state = timers.get(auctionId);
  if (state?.handle) clearInterval(state.handle);
  timers.delete(auctionId);
}

/** Current snapshot for REST reads / new-socket state sync. Null if no timer is tracked (e.g. after a restart). */
export function getTimerState(auctionId: string): TimerSnapshot | null {
  const state = timers.get(auctionId);
  if (!state) return null;
  return { total: state.total, remaining: state.remaining, status: state.status };
}
