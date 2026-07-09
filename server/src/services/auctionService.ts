import { Auction, IAuction } from "../models/Auction";
import { Player } from "../models/Player";
import { Team } from "../models/Team";
import { Bid } from "../models/Bid";
import { History } from "../models/History";
import { ApiError } from "../middleware/errorMiddleware";
import { emitToAuction, SOCKET_EVENTS } from "../socket/ioInstance";
import * as timerEngine from "../socket/timerEngine";

const POPULATE_LOT = [
  { path: "currentPlayer", select: "name role country basePrice status stats photoUrl" },
  { path: "leadingTeam", select: "name shortName purseRemaining" },
];

const AUTO_ADVANCE_DELAY_MS = 3000;

/** Pending "move to the next lot" timers, keyed by auction id — lets a manual next-lot preempt the automatic one. */
const pendingAdvance = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Per-auction async mutex. Every mutating action (bids, sold/unsold,
 * next-lot, timer controls, lifecycle changes) is routed through this so
 * concurrent calls for the same auction — a double-click, two admin tabs,
 * or a manual next-lot racing the auto-advance timer — run strictly one
 * after another instead of interleaving mid-way through a read-modify-write
 * on the same document. Each auction's queue is independent of the others.
 */
const auctionLocks = new Map<string, Promise<unknown>>();

function withAuctionLock<T>(auctionId: string, fn: () => Promise<T>): Promise<T> {
  const previous = auctionLocks.get(auctionId) ?? Promise.resolve();
  const run = previous.then(fn, fn);
  auctionLocks.set(
    auctionId,
    run.catch(() => undefined)
  );
  return run;
}

function cancelPendingAdvance(auctionId: string): void {
  const handle = pendingAdvance.get(auctionId);
  if (handle) {
    clearTimeout(handle);
    pendingAdvance.delete(auctionId);
  }
}

async function populateAuction(auction: IAuction) {
  return auction.populate(POPULATE_LOT);
}

/** Attaches the live (in-memory) timer snapshot to a plain auction payload for REST/sync reads. */
function withTimer(auction: IAuction) {
  const plain = auction.toObject();
  return {
    ...plain,
    timer: timerEngine.getTimerState(auction.id) ?? {
      total: auction.bidTimerSeconds,
      remaining: auction.bidTimerSeconds,
      status: "idle" as const,
    },
  };
}

/** Picks the next Available player (oldest first) and loads it onto the lot. Mutates but does not save. */
async function loadNextLot(auction: IAuction): Promise<boolean> {
  const nextPlayer = await Player.findOne({ status: "Available" }).sort({ createdAt: 1 });
  if (!nextPlayer) {
    auction.currentPlayer = undefined;
    auction.currentBid = 0;
    auction.leadingTeam = undefined;
    return false;
  }
  auction.currentPlayer = nextPlayer._id;
  auction.currentBid = nextPlayer.basePrice;
  auction.leadingTeam = undefined;
  auction.biddingOpen = true;
  return true;
}

/**
 * Puts every currently-Unsold player back into the pool as Available, starting a new
 * round of bidding for them. Returns how many players were requeued. Global player pool
 * (not scoped per auction), matching the rest of the engine's design.
 */
async function requeueUnsoldPlayers(): Promise<number> {
  const result = await Player.updateMany({ status: "Unsold" }, { $set: { status: "Available" } });
  return result.modifiedCount ?? 0;
}

/**
 * Loads the next lot. If the pool of Available players is exhausted, any Unsold players
 * are requeued for another round before completing — the auction only completes once
 * every player is Sold, or the admin manually ends it. Saves + broadcasts either way.
 */
async function advanceToNextLotOrComplete(auction: IAuction) {
  // If a lot is already active — set by a manual next-lot that raced ahead of
  // a stale auto-advance timer for the same auction, both queued on the lock
  // — don't advance a second time and skip a player; just report current state.
  if (auction.currentPlayer) {
    const current = await Player.findById(auction.currentPlayer);
    if (current && current.status === "Available") {
      return { completed: false as const, auction: await populateAuction(auction) };
    }
  }

  let hasLot = await loadNextLot(auction);

  if (!hasLot) {
    const requeued = await requeueUnsoldPlayers();
    if (requeued > 0) {
      auction.currentRound += 1;
      hasLot = await loadNextLot(auction);
      emitToAuction(auction.id, SOCKET_EVENTS.AUCTION_ROUND_ADVANCED, {
        round: auction.currentRound,
        requeuedCount: requeued,
      });
    }
  }

  if (!hasLot) {
    auction.status = "completed";
    auction.endedAt = new Date();
    await auction.save();
    timerEngine.stopTimer(auction.id);
    emitToAuction(auction.id, SOCKET_EVENTS.AUCTION_COMPLETED, { auctionId: auction.id });
    return { completed: true as const, auction };
  }

  await auction.save();
  const populated = await populateAuction(auction);
  timerEngine.startTimer(auction.id, auction.bidTimerSeconds);
  emitToAuction(auction.id, SOCKET_EVENTS.LOT_CHANGED, withTimer(populated));
  return { completed: false as const, auction: populated };
}

/** Schedules the automatic move to the next player a few seconds after a lot closes (sold/unsold). */
function scheduleAutoAdvance(auctionId: string): void {
  const handle = setTimeout(async () => {
    pendingAdvance.delete(auctionId);
    try {
      await withAuctionLock(auctionId, async () => {
        const auction = await Auction.findById(auctionId);
        if (!auction || auction.status !== "live") return;
        // A manual next-lot may have already advanced the lot while this
        // timer was queued behind another lock holder — only auto-advance
        // if the lot is still genuinely unresolved (no player, or a resolved
        // one waiting to be replaced).
        await advanceToNextLotOrComplete(auction);
      });
    } catch (error) {
      console.error(`[auctionService] auto-advance failed for ${auctionId}:`, error);
    }
  }, AUTO_ADVANCE_DELAY_MS);
  pendingAdvance.set(auctionId, handle);
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function createAuction(payload: Partial<IAuction>, adminId: string) {
  const { name, season, rounds, bidTimerSeconds, bidIncrements } = payload;
  return Auction.create({ name, season, rounds, bidTimerSeconds, bidIncrements, createdBy: adminId });
}

export async function listAuctions(filter: Record<string, unknown>) {
  const auctions = await Auction.find(filter).populate(POPULATE_LOT).sort({ createdAt: -1 });
  return auctions.map((a) => withTimer(a));
}

export async function getAuction(id: string) {
  const auction = await Auction.findById(id).populate(POPULATE_LOT);
  if (!auction) throw new ApiError(404, "Auction not found");
  return withTimer(auction);
}

export async function updateAuction(id: string, updates: Record<string, unknown>) {
  const forbidden = ["status", "currentPlayer", "currentBid", "leadingTeam", "createdBy", "startedAt", "endedAt"];
  const safeUpdates = Object.fromEntries(Object.entries(updates).filter(([key]) => !forbidden.includes(key)));

  const auction = await Auction.findByIdAndUpdate(id, safeUpdates, { new: true, runValidators: true }).populate(
    POPULATE_LOT
  );
  if (!auction) throw new ApiError(404, "Auction not found");
  return withTimer(auction);
}

export async function deleteAuction(id: string) {
  return withAuctionLock(id, async () => {
    const auction = await Auction.findById(id);
    if (!auction) throw new ApiError(404, "Auction not found");
    if (auction.status === "live") {
      throw new ApiError(400, "Cannot delete a live auction — pause or end it first");
    }
    cancelPendingAdvance(id);
    timerEngine.stopTimer(id);
    await auction.deleteOne();
  });
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export async function startAuction(id: string) {
  return withAuctionLock(id, async () => {
    const auction = await Auction.findById(id);
    if (!auction) throw new ApiError(404, "Auction not found");
    if (auction.status !== "draft") {
      throw new ApiError(400, `Cannot start an auction with status "${auction.status}"`);
    }

    const hasLot = await loadNextLot(auction);
    if (!hasLot) throw new ApiError(400, "No available players to start the auction with");

    auction.status = "live";
    auction.startedAt = new Date();
    await auction.save();

    const populated = await populateAuction(auction);
    timerEngine.startTimer(id, auction.bidTimerSeconds);
    emitToAuction(id, SOCKET_EVENTS.AUCTION_STATUS_CHANGED, { status: "live" });
    emitToAuction(id, SOCKET_EVENTS.LOT_CHANGED, withTimer(populated));

    return withTimer(populated);
  });
}

export async function pauseAuction(id: string) {
  return withAuctionLock(id, async () => {
    const auction = await Auction.findById(id);
    if (!auction) throw new ApiError(404, "Auction not found");
    if (auction.status !== "live") throw new ApiError(400, `Cannot pause an auction with status "${auction.status}"`);

    auction.status = "paused";
    await auction.save();
    timerEngine.pauseTimer(id);
    emitToAuction(id, SOCKET_EVENTS.AUCTION_STATUS_CHANGED, { status: "paused" });
    return auction;
  });
}

export async function resumeAuction(id: string) {
  return withAuctionLock(id, async () => {
    const auction = await Auction.findById(id);
    if (!auction) throw new ApiError(404, "Auction not found");
    if (auction.status !== "paused")
      throw new ApiError(400, `Cannot resume an auction with status "${auction.status}"`);

    auction.status = "live";
    await auction.save();
    timerEngine.resumeTimer(id);
    emitToAuction(id, SOCKET_EVENTS.AUCTION_STATUS_CHANGED, { status: "live" });
    return auction;
  });
}

/**
 * Manual admin override: ends the auction right now regardless of how many
 * players are still Available/Unsold. Distinct from the natural "completed"
 * outcome (every player sold) — this sets "closed" so the UI can show
 * "Auction Closed" rather than "Auction Complete". Clears the active lot so
 * bidding is unambiguously locked; every Sold/Unsold record already saved to
 * History/Team stands as the final result.
 */
export async function endAuction(id: string) {
  return withAuctionLock(id, async () => {
    const auction = await Auction.findById(id);
    if (!auction) throw new ApiError(404, "Auction not found");
    if (auction.status === "completed" || auction.status === "closed") {
      throw new ApiError(400, "Auction is already finished");
    }

    cancelPendingAdvance(id);
    timerEngine.stopTimer(id);

    auction.status = "closed";
    auction.currentPlayer = undefined;
    auction.currentBid = 0;
    auction.leadingTeam = undefined;
    auction.biddingOpen = false;
    auction.endedAt = new Date();
    await auction.save();

    emitToAuction(id, SOCKET_EVENTS.AUCTION_STATUS_CHANGED, { status: "closed" });
    emitToAuction(id, SOCKET_EVENTS.AUCTION_CLOSED, { auctionId: id });
    return auction;
  });
}

/** Manual override to force the next lot (e.g. skip a player who isn't present). No-ops any pending auto-advance. */
export async function nextLot(id: string) {
  return withAuctionLock(id, async () => {
    const auction = await Auction.findById(id);
    if (!auction) throw new ApiError(404, "Auction not found");
    if (auction.status !== "live") throw new ApiError(400, "Auction must be live to advance to the next lot");

    if (auction.currentPlayer) {
      const player = await Player.findById(auction.currentPlayer);
      if (player && player.status === "Available") {
        throw new ApiError(400, "Resolve the current lot (sold/unsold) before advancing");
      }
    }

    cancelPendingAdvance(id);
    const result = await advanceToNextLotOrComplete(auction);
    return result.completed ? { completed: true } : { completed: false, auction: withTimer(result.auction) };
  });
}

// ---------------------------------------------------------------------------
// Timer controls (per-lot, independent of overall auction status)
// ---------------------------------------------------------------------------

export async function pauseLotTimer(id: string) {
  return withAuctionLock(id, async () => {
    const auction = await Auction.findById(id);
    if (!auction) throw new ApiError(404, "Auction not found");
    if (auction.status !== "live") throw new ApiError(400, "Auction is not live");
    const snapshot = timerEngine.pauseTimer(id);
    if (!snapshot) throw new ApiError(400, "There is no active timer to pause");
    return snapshot;
  });
}

export async function resumeLotTimer(id: string) {
  return withAuctionLock(id, async () => {
    const auction = await Auction.findById(id);
    if (!auction) throw new ApiError(404, "Auction not found");
    if (auction.status !== "live") throw new ApiError(400, "Auction is not live");
    const snapshot = timerEngine.resumeTimer(id);
    if (!snapshot) throw new ApiError(400, "There is no paused timer to resume");
    return snapshot;
  });
}

export async function resetLotTimer(id: string) {
  return withAuctionLock(id, async () => {
    const auction = await Auction.findById(id);
    if (!auction) throw new ApiError(404, "Auction not found");
    if (auction.status !== "live") throw new ApiError(400, "Auction is not live");
    const snapshot = timerEngine.resetTimer(id, auction.bidTimerSeconds);
    if (!snapshot) throw new ApiError(400, "There is no active timer to reset");
    return snapshot;
  });
}

// ---------------------------------------------------------------------------
// Bidding
// ---------------------------------------------------------------------------

function resolveStep(auction: IAuction, amount?: number): number {
  if (amount && amount > 0) return amount;
  return auction.bidIncrements[0] ?? 100;
}

/** Keeps the leading team's most recent Bid ledger entry in sync after an increase/decrease correction. */
async function syncLeadingBidAmount(auction: IAuction): Promise<void> {
  if (!auction.leadingTeam) return;
  await Bid.findOneAndUpdate(
    { auction: auction._id, player: auction.currentPlayer, team: auction.leadingTeam },
    { amount: auction.currentBid },
    { sort: { createdAt: -1 } }
  );
}

export async function increaseBid(id: string, amount?: number) {
  return withAuctionLock(id, async () => {
    const auction = await Auction.findById(id);
    if (!auction) throw new ApiError(404, "Auction not found");
    if (auction.status !== "live") throw new ApiError(400, "Auction is not live");
    if (!auction.currentPlayer) throw new ApiError(400, "There is no active lot");
    if (!auction.biddingOpen) throw new ApiError(400, "Bidding is closed for this lot");

    const step = resolveStep(auction, amount);
    const nextBid = auction.currentBid + step;

    if (auction.leadingTeam) {
      const team = await Team.findById(auction.leadingTeam);
      if (team && team.purseRemaining < nextBid) {
        throw new ApiError(400, `${team.name} only has ${team.purseRemaining} remaining in purse`);
      }
    }

    auction.currentBid = nextBid;
    await auction.save();
    await syncLeadingBidAmount(auction);

    const payload = { currentBid: auction.currentBid, leadingTeam: auction.leadingTeam ?? null, step };
    emitToAuction(id, SOCKET_EVENTS.BID_UPDATED, payload);
    return payload;
  });
}

export async function decreaseBid(id: string, amount?: number) {
  return withAuctionLock(id, async () => {
    const auction = await Auction.findById(id);
    if (!auction) throw new ApiError(404, "Auction not found");
    if (auction.status !== "live") throw new ApiError(400, "Auction is not live");
    if (!auction.currentPlayer) throw new ApiError(400, "There is no active lot");
    if (!auction.biddingOpen) throw new ApiError(400, "Bidding is closed for this lot");

    const player = await Player.findById(auction.currentPlayer);
    const floor = player?.basePrice ?? 0;
    const step = resolveStep(auction, amount);

    auction.currentBid = Math.max(floor, auction.currentBid - step);
    await auction.save();
    await syncLeadingBidAmount(auction);

    const payload = { currentBid: auction.currentBid, leadingTeam: auction.leadingTeam ?? null, step };
    emitToAuction(id, SOCKET_EVENTS.BID_UPDATED, payload);
    return payload;
  });
}

export async function selectTeam(id: string, teamId: string, adminId: string) {
  return withAuctionLock(id, async () => {
    const auction = await Auction.findById(id);
    if (!auction) throw new ApiError(404, "Auction not found");
    if (auction.status !== "live") throw new ApiError(400, "Auction is not live");
    if (!auction.currentPlayer) throw new ApiError(400, "There is no active lot");
    if (!auction.biddingOpen) throw new ApiError(400, "Bidding is closed for this lot");

    const team = await Team.findById(teamId);
    if (!team) throw new ApiError(404, "Team not found");
    if (auction.leadingTeam && auction.leadingTeam.toString() === team.id) {
      throw new ApiError(400, `${team.name} is already the leading bidder on this lot`);
    }
    if (team.purseRemaining < auction.currentBid) {
      throw new ApiError(400, `${team.name} only has ${team.purseRemaining} remaining in purse`);
    }
    if (team.players.length >= team.maxPlayers) {
      throw new ApiError(400, `${team.name} already has a full squad (${team.maxPlayers} players)`);
    }

    auction.leadingTeam = team._id;
    await auction.save();

    const bid = await Bid.create({
      auction: auction._id,
      player: auction.currentPlayer,
      team: team._id,
      amount: auction.currentBid,
      round: auction.currentRound,
      placedBy: adminId,
    });
    const populatedBid = await bid.populate([{ path: "team", select: "name shortName" }]);

    const payload = {
      currentBid: auction.currentBid,
      leadingTeam: { id: team.id, name: team.name, shortName: team.shortName },
      bid: populatedBid,
    };
    emitToAuction(id, SOCKET_EVENTS.BID_PLACED, payload);
    return payload;
  });
}

// ---------------------------------------------------------------------------
// Closing a lot
// ---------------------------------------------------------------------------

export async function markSold(id: string, adminId: string) {
  return withAuctionLock(id, async () => {
    const auction = await Auction.findById(id);
    if (!auction) throw new ApiError(404, "Auction not found");
    if (auction.status !== "live") throw new ApiError(400, "Auction is not live");
    if (!auction.currentPlayer) throw new ApiError(400, "There is no active lot to close");
    if (!auction.leadingTeam) throw new ApiError(400, "Cannot mark sold — no bids have been placed on this lot");

    const [player, team] = await Promise.all([
      Player.findById(auction.currentPlayer),
      Team.findById(auction.leadingTeam),
    ]);
    if (!player) throw new ApiError(404, "Player on the current lot no longer exists");
    // Guards against a duplicate SOLD firing twice for the same lot (e.g. a
    // double-click that both queued up before the lock could serialize them) —
    // the first call already flipped the player out of "Available".
    if (player.status !== "Available") {
      throw new ApiError(400, "This player has already been resolved (sold/unsold) — refresh and try the next lot");
    }
    if (!team) throw new ApiError(404, "Leading team no longer exists");
    if (team.purseRemaining < auction.currentBid) {
      throw new ApiError(400, `${team.name} does not have enough purse remaining for this bid`);
    }
    if (team.players.length >= team.maxPlayers) {
      throw new ApiError(400, `${team.name} already has a full squad (${team.maxPlayers} players)`);
    }

    player.status = "Sold";
    player.soldPrice = auction.currentBid;
    player.team = team._id;
    await player.save();

    team.purseRemaining -= auction.currentBid;
    team.players.push(player._id);
    await team.save();

    const history = await History.create({
      auction: auction._id,
      player: player._id,
      team: team._id,
      price: auction.currentBid,
      status: "Sold",
      round: auction.currentRound,
      closedBy: adminId,
    });

    // Close the lot immediately so a stray bid/select-team call that was
    // already in flight when SOLD landed can't slip in afterwards.
    auction.currentPlayer = undefined;
    auction.biddingOpen = false;
    await auction.save();

    timerEngine.stopTimer(id);
    const payload = { result: "sold" as const, player, team, price: history.price, history };
    emitToAuction(id, SOCKET_EVENTS.LOT_CLOSED, payload);
    scheduleAutoAdvance(id);

    return payload;
  });
}

export async function markUnsold(id: string, adminId: string) {
  return withAuctionLock(id, async () => {
    const auction = await Auction.findById(id);
    if (!auction) throw new ApiError(404, "Auction not found");
    if (auction.status !== "live") throw new ApiError(400, "Auction is not live");
    if (!auction.currentPlayer) throw new ApiError(400, "There is no active lot to close");
    if (auction.leadingTeam) {
      throw new ApiError(400, "Cannot mark unsold — this lot has an active bid. Mark it sold instead.");
    }

    const player = await Player.findById(auction.currentPlayer);
    if (!player) throw new ApiError(404, "Player on the current lot no longer exists");
    if (player.status !== "Available") {
      throw new ApiError(400, "This player has already been resolved (sold/unsold) — refresh and try the next lot");
    }

    player.status = "Unsold";
    await player.save();

    const history = await History.create({
      auction: auction._id,
      player: player._id,
      status: "Unsold",
      round: auction.currentRound,
      closedBy: adminId,
    });

    auction.currentPlayer = undefined;
    auction.biddingOpen = false;
    await auction.save();

    timerEngine.stopTimer(id);
    const payload = { result: "unsold" as const, player, history };
    emitToAuction(id, SOCKET_EVENTS.LOT_CLOSED, payload);
    scheduleAutoAdvance(id);

    return payload;
  });
}

// ---------------------------------------------------------------------------
// Bidding gate (open the floor for the current lot, then close it before the hammer falls)
// ---------------------------------------------------------------------------

export async function openBidding(id: string) {
  return withAuctionLock(id, async () => {
    const auction = await Auction.findById(id);
    if (!auction) throw new ApiError(404, "Auction not found");
    if (auction.status !== "live") throw new ApiError(400, "Auction is not live");
    if (!auction.currentPlayer) throw new ApiError(400, "There is no active lot");
    if (auction.biddingOpen) throw new ApiError(400, "Bidding is already open");

    auction.biddingOpen = true;
    await auction.save();
    const payload = { biddingOpen: true };
    emitToAuction(id, SOCKET_EVENTS.BIDDING_CHANGED, payload);
    return payload;
  });
}

export async function closeBidding(id: string) {
  return withAuctionLock(id, async () => {
    const auction = await Auction.findById(id);
    if (!auction) throw new ApiError(404, "Auction not found");
    if (auction.status !== "live") throw new ApiError(400, "Auction is not live");
    if (!auction.currentPlayer) throw new ApiError(400, "There is no active lot");
    if (!auction.biddingOpen) throw new ApiError(400, "Bidding is already closed");

    auction.biddingOpen = false;
    await auction.save();
    const payload = { biddingOpen: false };
    emitToAuction(id, SOCKET_EVENTS.BIDDING_CHANGED, payload);
    return payload;
  });
}

// ---------------------------------------------------------------------------
// Reset — wipes this auction's progress and returns every player to the pool
// ---------------------------------------------------------------------------

/**
 * Undoes the entire auction: every Sold/Unsold player goes back to
 * Available, every team's purse and roster is refunded, and all Bid/History
 * rows for this auction are deleted. The auction itself returns to "draft"
 * so the admin can hit Start again. Used to reset a demo or recover from a
 * botched run — not something to expose without a confirmation prompt.
 */
export async function resetAuction(id: string) {
  return withAuctionLock(id, async () => {
    const auction = await Auction.findById(id);
    if (!auction) throw new ApiError(404, "Auction not found");
    if (auction.status === "live") {
      throw new ApiError(400, "Pause or end the auction before resetting it");
    }

    cancelPendingAdvance(id);
    timerEngine.stopTimer(id);

    const entries = await History.find({ auction: id });
    for (const entry of entries) {
      const player = await Player.findById(entry.player);
      if (player) {
        player.status = "Available";
        player.soldPrice = undefined;
        player.team = undefined;
        await player.save();
      }
      if (entry.status === "Sold" && entry.team) {
        const team = await Team.findById(entry.team);
        if (team) {
          team.players = team.players.filter((pid) => pid.toString() !== entry.player.toString());
          team.purseRemaining += entry.price ?? 0;
          await team.save();
        }
      }
    }

    await Promise.all([History.deleteMany({ auction: id }), Bid.deleteMany({ auction: id })]);

    auction.status = "draft";
    auction.currentPlayer = undefined;
    auction.currentBid = 0;
    auction.leadingTeam = undefined;
    auction.biddingOpen = true;
    auction.currentRound = 1;
    auction.startedAt = undefined;
    auction.endedAt = undefined;
    await auction.save();

    emitToAuction(id, SOCKET_EVENTS.AUCTION_RESET, { auctionId: id });
    return withTimer(auction);
  });
}
