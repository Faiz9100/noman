import { body, query } from "express-validator";

const PLAYER_ROLES = ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"];
const PLAYER_STATUSES = ["Available", "Sold", "Unsold"];

/**
 * multipart/form-data (used for photo uploads) has no nested-object
 * convention, so the client sends `stats` as a single JSON string field.
 * This normalizes it back into a real object before the sub-field
 * validators below run, and before the controller reads req.body.stats.
 */
const parseStatsField = body("stats")
  .optional()
  .customSanitizer((value) => {
    if (typeof value !== "string") return value;
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && parsed !== null ? parsed : undefined;
    } catch {
      return undefined;
    }
  });

export const createPlayerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }),
  body("role").optional({ checkFalsy: true }).trim().isIn(PLAYER_ROLES).withMessage(`Role must be one of: ${PLAYER_ROLES.join(", ")}`),
  body("country").optional({ checkFalsy: true }).trim(),
  body("age").optional({ checkFalsy: true }).isInt({ min: 0, max: 70 }).withMessage("Age must be a whole number"),
  body("battingStyle").optional({ checkFalsy: true }).isString().trim(),
  body("bowlingStyle").optional({ checkFalsy: true }).isString().trim(),
  // No min/max — the admin can enter any base price, any scale.
  body("basePrice").optional({ checkFalsy: true }).isFloat().withMessage("Base price must be a number"),
  body("status").optional().isIn(PLAYER_STATUSES).withMessage(`Status must be one of: ${PLAYER_STATUSES.join(", ")}`),
  parseStatsField,
  body("stats.matches").optional({ checkFalsy: true }).isInt({ min: 0 }),
  body("stats.runs").optional({ checkFalsy: true }).isInt({ min: 0 }),
  body("stats.wickets").optional({ checkFalsy: true }).isInt({ min: 0 }),
  body("stats.average").optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body("stats.strikeRate").optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body("stats.economy").optional({ checkFalsy: true }).isFloat({ min: 0 }),
];

export const updatePlayerValidator = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty").isLength({ max: 100 }),
  body("role").optional({ checkFalsy: true }).isIn(PLAYER_ROLES).withMessage(`Role must be one of: ${PLAYER_ROLES.join(", ")}`),
  body("country").optional({ checkFalsy: true }).trim(),
  body("age").optional({ checkFalsy: true }).isInt({ min: 0, max: 70 }).withMessage("Age must be a whole number"),
  body("battingStyle").optional({ checkFalsy: true }).isString().trim(),
  body("bowlingStyle").optional({ checkFalsy: true }).isString().trim(),
  body("basePrice").optional().isFloat().withMessage("Base price must be a number"),
  body("status").optional().isIn(PLAYER_STATUSES).withMessage(`Status must be one of: ${PLAYER_STATUSES.join(", ")}`),
  body("soldPrice").optional().isFloat(),
  body("team").optional().isMongoId().withMessage("team must be a valid id"),
  parseStatsField,
  body("stats.matches").optional({ checkFalsy: true }).isInt({ min: 0 }),
  body("stats.runs").optional({ checkFalsy: true }).isInt({ min: 0 }),
  body("stats.wickets").optional({ checkFalsy: true }).isInt({ min: 0 }),
  body("stats.average").optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body("stats.strikeRate").optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body("stats.economy").optional({ checkFalsy: true }).isFloat({ min: 0 }),
];

export const listPlayersValidator = [
  query("status").optional().isIn(PLAYER_STATUSES),
  query("role").optional().isIn(PLAYER_ROLES),
  query("search").optional().isString().trim(),
];
