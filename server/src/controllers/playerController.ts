import { Response } from "express";
import asyncHandler from "express-async-handler";
import { Player } from "../models/Player";
import { ApiError } from "../middleware/errorMiddleware";
import { AuthRequest } from "../middleware/authMiddleware";
import { parseCsv } from "../utils/csv";
import { emitGlobal, SOCKET_EVENTS } from "../socket/ioInstance";

/** Normalizes loosely-formatted role strings from user CSVs (e.g. "All rounder", "all-rounder", "WK") to the canonical role labels. */
function normalizeRole(raw: string): string | null {
  const key = raw.trim().toLowerCase().replace(/[\s_-]+/g, " ");
  if (["batsman", "batter"].includes(key)) return "Batsman";
  if (["bowler"].includes(key)) return "Bowler";
  if (["all rounder", "allrounder"].includes(key)) return "All-Rounder";
  if (["wicket keeper", "wicketkeeper", "wk", "keeper"].includes(key)) return "Wicket-Keeper";
  return null;
}

/** @route GET /api/players */
export const getPlayers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, role, search } = req.query;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (role) filter.role = role;
  if (search) filter.name = { $regex: String(search), $options: "i" };

  const players = await Player.find(filter)
    .populate("team", "name shortName")
    .sort({ createdAt: 1 });
  res.status(200).json({ success: true, count: players.length, data: players });
});

/** @route GET /api/players/:id */
export const getPlayerById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const player = await Player.findById(req.params.id).populate("team", "name shortName");
  if (!player) throw new ApiError(404, "Player not found");
  res.status(200).json({ success: true, data: player });
});

/** @route POST /api/players */
export const createPlayer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, role, country, age, battingStyle, bowlingStyle, basePrice, stats } = req.body;
  const photoUrl = req.file ? `/uploads/${req.file.filename}` : req.body.photoUrl;

  // Falsy/blank optional fields are left undefined so the schema's defaults apply
  // instead of persisting an empty string — nothing but a name is truly required.
  const player = await Player.create({
    name,
    role: role || undefined,
    country: country || undefined,
    age: age || undefined,
    battingStyle: battingStyle || undefined,
    bowlingStyle: bowlingStyle || undefined,
    basePrice: basePrice === "" || basePrice === undefined ? undefined : basePrice,
    stats,
    photoUrl,
  });
  res.status(201).json({ success: true, data: player });
});

/** @route PUT /api/players/:id */
export const updatePlayer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const updates = { ...req.body };
  // An empty string for role must not hit the enum validator — treat it as "leave unset."
  if (updates.role === "") delete updates.role;
  if (req.file) updates.photoUrl = `/uploads/${req.file.filename}`;

  const player = await Player.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate("team", "name shortName");
  if (!player) throw new ApiError(404, "Player not found");

  // Lets Live Auction / Projector patch this player in place — e.g. an image
  // fix mid-auction — without waiting for the next lot change to re-populate.
  emitGlobal(SOCKET_EVENTS.PLAYER_UPDATED, { player });

  res.status(200).json({ success: true, data: player });
});

/** @route DELETE /api/players/:id */
export const deletePlayer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const player = await Player.findById(req.params.id);
  if (!player) throw new ApiError(404, "Player not found");
  if (player.status === "Sold") {
    throw new ApiError(
      400,
      `Cannot delete ${player.name} — they've already been sold. Undo the sale from Auction History first.`
    );
  }
  await player.deleteOne();
  res.status(200).json({ success: true, message: "Player deleted" });
});

/**
 * @route POST /api/players/import
 * Bulk-creates players from an uploaded CSV (field name "file"). Required
 * columns: name, role, basePrice. Role is matched loosely (e.g. "All rounder",
 * "all-rounder" both map to "All-Rounder"). country is optional (defaults to
 * "Not specified"); matches, runs, wickets, average, strikeRate, economy, age,
 * battingStyle, bowlingStyle are all optional. Bad rows are skipped and
 * reported rather than failing the whole import.
 */
export const importPlayersCsv = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) throw new ApiError(400, 'No CSV file uploaded (expected field "file")');

  const rows = parseCsv(req.file.buffer.toString("utf-8"));
  if (rows.length === 0) throw new ApiError(400, "CSV file is empty or has no data rows");

  const createdIds: string[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // header occupies row 1

    const name = row.name;
    const role = row.role ? normalizeRole(row.role) : null;
    const country = row.country || "Not specified";
    const basePrice = Number(row.basePrice);

    if (!name) {
      errors.push({ row: rowNumber, message: "Missing name" });
      continue;
    }
    if (!role) {
      errors.push({ row: rowNumber, message: `Invalid role "${row.role || ""}" — must be Batsman, Bowler, All Rounder, or Wicket Keeper` });
      continue;
    }
    if (!Number.isFinite(basePrice)) {
      errors.push({ row: rowNumber, message: `Invalid basePrice "${row.basePrice || ""}"` });
      continue;
    }

    const stats: Record<string, number> = {};
    if (row.matches) stats.matches = Number(row.matches);
    if (row.runs) stats.runs = Number(row.runs);
    if (row.wickets) stats.wickets = Number(row.wickets);
    if (row.average) stats.average = Number(row.average);
    if (row.strikeRate) stats.strikeRate = Number(row.strikeRate);
    if (row.economy) stats.economy = Number(row.economy);

    try {
      const player = await Player.create({
        name,
        role,
        country,
        age: row.age ? Number(row.age) : undefined,
        battingStyle: row.battingStyle || undefined,
        bowlingStyle: row.bowlingStyle || undefined,
        basePrice,
        stats,
      });
      createdIds.push(player.id);
    } catch (err) {
      errors.push({ row: rowNumber, message: err instanceof Error ? err.message : "Failed to create player" });
    }
  }

  res.status(createdIds.length > 0 ? 201 : 400).json({
    success: createdIds.length > 0,
    message: `Imported ${createdIds.length} of ${rows.length} players`,
    data: { createdCount: createdIds.length, totalRows: rows.length, errors },
  });
});
