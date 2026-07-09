import { body, query } from "express-validator";

export const createBidValidator = [
  body("auction").notEmpty().withMessage("auction is required").isMongoId().withMessage("auction must be a valid id"),
  body("team").notEmpty().withMessage("team is required").isMongoId().withMessage("team must be a valid id"),
  body("amount").optional().isFloat({ gt: 0 }).withMessage("amount must be a positive number"),
  body("increment").optional().isFloat({ gt: 0 }).withMessage("increment must be a positive number"),
  body().custom((value) => {
    if (value.amount === undefined && value.increment === undefined) {
      throw new Error("Provide either amount or increment");
    }
    return true;
  }),
];

export const listBidsValidator = [
  query("auction").optional().isMongoId().withMessage("auction must be a valid id"),
  query("player").optional().isMongoId().withMessage("player must be a valid id"),
  query("team").optional().isMongoId().withMessage("team must be a valid id"),
];
