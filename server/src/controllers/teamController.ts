import { Response } from "express";
import asyncHandler from "express-async-handler";
import { Team } from "../models/Team";
import { ApiError } from "../middleware/errorMiddleware";
import { AuthRequest } from "../middleware/authMiddleware";

/** @route GET /api/teams */
export const getTeams = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const teams = await Team.find().populate("players", "name role status soldPrice photoUrl").sort({ createdAt: 1 });
  res.status(200).json({ success: true, count: teams.length, data: teams });
});

/** @route GET /api/teams/:id */
export const getTeamById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const team = await Team.findById(req.params.id).populate("players");
  if (!team) throw new ApiError(404, "Team not found");
  res.status(200).json({ success: true, data: team });
});

/** @route POST /api/teams */
export const createTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, shortName, owner, purseTotal, maxPlayers, color } = req.body;
  const logoUrl = req.file ? `/uploads/${req.file.filename}` : req.body.logoUrl;

  const team = await Team.create({
    name,
    shortName,
    owner,
    purseTotal,
    purseRemaining: purseTotal,
    maxPlayers,
    logoUrl,
    color,
  });

  res.status(201).json({ success: true, data: team });
});

/** @route PUT /api/teams/:id */
export const updateTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const updates = { ...req.body };
  if (req.file) updates.logoUrl = `/uploads/${req.file.filename}`;

  const team = await Team.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate("players", "name role status soldPrice photoUrl");
  if (!team) throw new ApiError(404, "Team not found");
  res.status(200).json({ success: true, data: team });
});

/** @route DELETE /api/teams/:id */
export const deleteTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw new ApiError(404, "Team not found");
  if (team.players.length > 0) {
    throw new ApiError(
      400,
      `Cannot delete ${team.name} — it has ${team.players.length} player(s) on its roster. Reset the auction or reassign them first.`
    );
  }
  await team.deleteOne();
  res.status(200).json({ success: true, message: "Team deleted" });
});
