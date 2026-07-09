import { body } from "express-validator";

export const createAuctionValidator = [
  body("name").trim().notEmpty().withMessage("Auction name is required").isLength({ max: 120 }),
  body("season").optional().trim().isString(),
  body("rounds").optional().isInt({ min: 1 }).withMessage("Rounds must be at least 1"),
  body("bidTimerSeconds").optional().isInt({ min: 5 }).withMessage("Bid timer must be at least 5 seconds"),
  body("bidIncrements")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Bid increments must be a non-empty array"),
  body("bidIncrements.*").optional().isFloat({ gt: 0 }).withMessage("Each bid increment must be a positive number"),
];

export const updateAuctionValidator = [
  body("name").optional().trim().notEmpty().withMessage("Auction name cannot be empty").isLength({ max: 120 }),
  body("season").optional().trim().isString(),
  body("rounds").optional().isInt({ min: 1 }).withMessage("Rounds must be at least 1"),
  body("currentRound").optional().isInt({ min: 1 }).withMessage("Current round must be at least 1"),
  body("bidTimerSeconds").optional().isInt({ min: 5 }).withMessage("Bid timer must be at least 5 seconds"),
  body("bidIncrements").optional().isArray({ min: 1 }).withMessage("Bid increments must be a non-empty array"),
  body("bidIncrements.*").optional().isFloat({ gt: 0 }).withMessage("Each bid increment must be a positive number"),
];
