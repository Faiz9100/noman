import { body } from "express-validator";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const createTeamValidator = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }),
  body("shortName").trim().notEmpty().withMessage("Short name is required").isLength({ max: 6 }).withMessage("Short name cannot exceed 6 characters"),
  body("owner").trim().notEmpty().withMessage("Owner is required"),
  // No min/max — the admin can enter any budget, any scale.
  body("purseTotal").notEmpty().withMessage("Budget is required").isFloat().withMessage("Budget must be a number"),
  body("maxPlayers").optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage("Maximum players must be at least 1"),
  body("color").optional().matches(HEX_COLOR).withMessage("Color must be a hex value like #22d3ee"),
];

export const updateTeamValidator = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty").isLength({ max: 100 }),
  body("shortName").optional().trim().notEmpty().isLength({ max: 6 }).withMessage("Short name cannot exceed 6 characters"),
  body("owner").optional().trim().notEmpty().withMessage("Owner cannot be empty"),
  body("purseTotal").optional().isFloat().withMessage("Budget must be a number"),
  body("purseRemaining").optional().isFloat().withMessage("Remaining budget must be a number"),
  body("maxPlayers").optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage("Maximum players must be at least 1"),
  body("color").optional().matches(HEX_COLOR).withMessage("Color must be a hex value like #22d3ee"),
];
