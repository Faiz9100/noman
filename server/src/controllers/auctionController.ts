import { Response } from "express";
import asyncHandler from "express-async-handler";
import { AuthRequest } from "../middleware/authMiddleware";
import * as auctionService from "../services/auctionService";

/** @route POST /api/auctions */
export const createAuction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const auction = await auctionService.createAuction(req.body, req.user!.id);
  res.status(201).json({ success: true, data: auction });
});

/** @route GET /api/auctions */
export const getAuctions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.query;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const auctions = await auctionService.listAuctions(filter);
  res.status(200).json({ success: true, count: auctions.length, data: auctions });
});

/** @route GET /api/auctions/:id */
export const getAuctionById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const auction = await auctionService.getAuction(req.params.id);
  res.status(200).json({ success: true, data: auction });
});

/** @route PUT /api/auctions/:id */
export const updateAuction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const auction = await auctionService.updateAuction(req.params.id, req.body);
  res.status(200).json({ success: true, data: auction });
});

/** @route DELETE /api/auctions/:id */
export const deleteAuction = asyncHandler(async (req: AuthRequest, res: Response) => {
  await auctionService.deleteAuction(req.params.id);
  res.status(200).json({ success: true, message: "Auction deleted" });
});

/** @route POST /api/auctions/:id/start */
export const startAuction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const auction = await auctionService.startAuction(req.params.id);
  res.status(200).json({ success: true, data: auction });
});

/** @route POST /api/auctions/:id/pause */
export const pauseAuction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const auction = await auctionService.pauseAuction(req.params.id);
  res.status(200).json({ success: true, data: auction });
});

/** @route POST /api/auctions/:id/resume */
export const resumeAuction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const auction = await auctionService.resumeAuction(req.params.id);
  res.status(200).json({ success: true, data: auction });
});

/** @route POST /api/auctions/:id/end */
export const endAuction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const auction = await auctionService.endAuction(req.params.id);
  res.status(200).json({ success: true, data: auction });
});

/** @route POST /api/auctions/:id/next-lot */
export const nextLot = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await auctionService.nextLot(req.params.id);
  res.status(200).json({
    success: true,
    message: result.completed ? "No players remaining — auction completed" : "Next lot loaded",
    data: result.completed ? null : result.auction,
  });
});

/** @route POST /api/auctions/:id/sold */
export const markSold = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await auctionService.markSold(req.params.id, req.user!.id);
  res.status(200).json({
    success: true,
    message: `${result.player.name} sold to ${result.team.name}`,
    data: result,
  });
});

/** @route POST /api/auctions/:id/unsold */
export const markUnsold = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await auctionService.markUnsold(req.params.id, req.user!.id);
  res.status(200).json({ success: true, message: `${result.player.name} went unsold`, data: result });
});

/** @route POST /api/auctions/:id/reset */
export const resetAuction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const auction = await auctionService.resetAuction(req.params.id);
  res.status(200).json({ success: true, message: "Auction reset — every player returned to the pool", data: auction });
});
