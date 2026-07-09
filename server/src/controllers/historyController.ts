import { Response } from "express";
import asyncHandler from "express-async-handler";
import { History } from "../models/History";
import { Player } from "../models/Player";
import { Team } from "../models/Team";
import { ApiError } from "../middleware/errorMiddleware";
import { AuthRequest } from "../middleware/authMiddleware";
import { toCsv } from "../utils/csv";

/** @route GET /api/history */
export const getHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { auction, team, status } = req.query;
  const filter: Record<string, unknown> = {};
  if (auction) filter.auction = auction;
  if (team) filter.team = team;
  if (status) filter.status = status;

  const history = await History.find(filter)
    .populate("player", "name role country photoUrl")
    .populate("team", "name shortName")
    .sort({ soldAt: -1 });

  res.status(200).json({ success: true, count: history.length, data: history });
});

/** @route GET /api/history/stats */
export const getHistoryStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [totalPlayers, playersSold, playersUnsold, remainingPlayers, upcomingPlayer] = await Promise.all([
    Player.countDocuments(),
    Player.countDocuments({ status: "Sold" }),
    Player.countDocuments({ status: "Unsold" }),
    Player.countDocuments({ status: "Available" }),
    Player.findOne({ status: "Available" }).sort({ createdAt: 1 }),
  ]);

  const [highestEntry] = await History.find({ status: "Sold" })
    .sort({ price: -1 })
    .limit(1)
    .populate("player", "name")
    .populate("team", "name shortName");

  const [averageAgg] = await History.aggregate([
    { $match: { status: "Sold" } },
    { $group: { _id: null, average: { $avg: "$price" } } },
  ]);

  const recentPurchases = await History.find({ status: "Sold" })
    .sort({ soldAt: -1 })
    .limit(5)
    .populate("player", "name role photoUrl")
    .populate("team", "name shortName");

  const [richestTeam] = await Team.find().sort({ purseRemaining: -1 }).limit(1);
  const [lowestBudgetTeam] = await Team.find().sort({ purseRemaining: 1 }).limit(1);

  const resolved = playersSold + playersUnsold;
  const auctionProgressPct = totalPlayers > 0 ? Math.round((resolved / totalPlayers) * 100) : 0;

  res.status(200).json({
    success: true,
    data: {
      totalPlayers,
      playersSold,
      playersUnsold,
      remainingPlayers,
      auctionProgressPct,
      averageBid: averageAgg ? Math.round(averageAgg.average) : 0,
      highestBid: highestEntry
        ? { amount: highestEntry.price, player: highestEntry.player, team: highestEntry.team }
        : null,
      richestTeam: richestTeam
        ? { _id: richestTeam._id, name: richestTeam.name, shortName: richestTeam.shortName, purseRemaining: richestTeam.purseRemaining }
        : null,
      lowestBudgetTeam: lowestBudgetTeam
        ? { _id: lowestBudgetTeam._id, name: lowestBudgetTeam.name, shortName: lowestBudgetTeam.shortName, purseRemaining: lowestBudgetTeam.purseRemaining }
        : null,
      upcomingPlayer,
      recentPurchases,
    },
  });
});

/**
 * @route GET /api/history/export
 * Downloads the full auction ledger as CSV — one row per resolved lot,
 * sold or unsold, oldest first.
 */
export const exportHistoryCsv = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { auction } = req.query;
  const filter: Record<string, unknown> = {};
  if (auction) filter.auction = auction;

  const history = await History.find(filter)
    .populate("player", "name role country")
    .populate("team", "name shortName")
    .sort({ soldAt: 1 });

  const rows = history.map((entry) => {
    const player = entry.player as unknown as { name: string; role: string; country: string };
    const team = entry.team as unknown as { name: string; shortName: string } | null;
    return {
      player: player?.name ?? "",
      role: player?.role ?? "",
      country: player?.country ?? "",
      status: entry.status,
      team: team?.name ?? "",
      price: entry.price ?? "",
      round: entry.round,
      soldAt: entry.soldAt.toISOString(),
    };
  });

  const csv = toCsv(rows, ["player", "role", "country", "status", "team", "price", "round", "soldAt"]);
  const filename = `auction-results-${new Date().toISOString().slice(0, 10)}.csv`;

  res.status(200);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
});

/** @route GET /api/history/:id */
export const getHistoryById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const entry = await History.findById(req.params.id).populate("player").populate("team").populate("auction", "name");
  if (!entry) throw new ApiError(404, "History entry not found");
  res.status(200).json({ success: true, data: entry });
});

/**
 * @route DELETE /api/history/:id
 * Undoes a sale/unsold result: reverts the player to Available, and — if
 * it was a sale — pulls the player from the team roster and refunds the
 * purse, then removes the ledger entry. Used by an admin to correct a
 * mistaken "sold"/"unsold" call.
 */
export const undoHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const entry = await History.findById(req.params.id);
  if (!entry) throw new ApiError(404, "History entry not found");

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
      team.players = team.players.filter((id) => id.toString() !== entry.player.toString());
      team.purseRemaining += entry.price ?? 0;
      await team.save();
    }
  }

  await entry.deleteOne();

  res.status(200).json({ success: true, message: "History entry undone — player returned to the pool" });
});
