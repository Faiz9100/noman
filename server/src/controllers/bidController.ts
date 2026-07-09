import { Response } from "express";
import asyncHandler from "express-async-handler";
import { Bid } from "../models/Bid";
import { Auction } from "../models/Auction";
import { Team } from "../models/Team";
import { ApiError } from "../middleware/errorMiddleware";
import { AuthRequest } from "../middleware/authMiddleware";
import { emitToAuction, SOCKET_EVENTS } from "../socket";

/**
 * @route POST /api/bids
 * Places a bid on the auction's current lot. The lot itself (which player
 * is up) is always derived from the auction's own state server-side —
 * never trusted from the client — so a stale UI can't bid on the wrong lot.
 */
export const placeBid = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { auction: auctionId, team: teamId, amount, increment } = req.body;

  const auction = await Auction.findById(auctionId);
  if (!auction) throw new ApiError(404, "Auction not found");
  if (auction.status !== "live") throw new ApiError(400, "Auction is not live");
  if (!auction.currentPlayer) throw new ApiError(400, "There is no active lot to bid on");

  const team = await Team.findById(teamId);
  if (!team) throw new ApiError(404, "Team not found");

  if (auction.leadingTeam && auction.leadingTeam.toString() === team.id) {
    throw new ApiError(400, `${team.name} is already the leading bidder on this lot`);
  }

  const bidAmount: number = amount !== undefined ? Number(amount) : auction.currentBid + Number(increment);

  if (bidAmount <= auction.currentBid) {
    throw new ApiError(400, `Bid must be higher than the current bid of ${auction.currentBid}`);
  }
  if (team.purseRemaining < bidAmount) {
    throw new ApiError(400, `${team.name} only has ${team.purseRemaining} remaining in purse`);
  }

  const bid = await Bid.create({
    auction: auction._id,
    player: auction.currentPlayer,
    team: team._id,
    amount: bidAmount,
    round: auction.currentRound,
    placedBy: req.user!.id,
  });

  auction.currentBid = bidAmount;
  auction.leadingTeam = team._id;
  await auction.save();

  const populatedBid = await bid.populate([
    { path: "team", select: "name shortName" },
    { path: "player", select: "name" },
  ]);

  emitToAuction(auction.id, SOCKET_EVENTS.BID_PLACED, {
    bid: populatedBid,
    currentBid: auction.currentBid,
    leadingTeam: { id: team.id, name: team.name, shortName: team.shortName },
  });

  res.status(201).json({ success: true, data: populatedBid });
});

/** @route GET /api/bids */
export const getBids = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { auction, player, team } = req.query;
  const filter: Record<string, unknown> = {};
  if (auction) filter.auction = auction;
  if (player) filter.player = player;
  if (team) filter.team = team;

  const bids = await Bid.find(filter)
    .populate("team", "name shortName")
    .populate("player", "name role")
    .populate("placedBy", "name")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: bids.length, data: bids });
});

/** @route GET /api/bids/:id */
export const getBidById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const bid = await Bid.findById(req.params.id)
    .populate("team", "name shortName")
    .populate("player", "name role")
    .populate("auction", "name status");
  if (!bid) throw new ApiError(404, "Bid not found");
  res.status(200).json({ success: true, data: bid });
});
