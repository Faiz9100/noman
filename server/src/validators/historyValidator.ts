import { query } from "express-validator";

export const listHistoryValidator = [
  query("auction").optional().isMongoId().withMessage("auction must be a valid id"),
  query("team").optional().isMongoId().withMessage("team must be a valid id"),
  query("status").optional().isIn(["Sold", "Unsold"]).withMessage("status must be Sold or Unsold"),
];
