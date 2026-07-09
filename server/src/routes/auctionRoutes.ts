import { Router } from "express";
import {
  createAuction,
  getAuctions,
  getAuctionById,
  updateAuction,
  deleteAuction,
  startAuction,
  pauseAuction,
  resumeAuction,
  endAuction,
  resetAuction,
  nextLot,
  markSold,
  markUnsold,
} from "../controllers/auctionController";
import { protect } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validateMiddleware";
import { createAuctionValidator, updateAuctionValidator } from "../validators/auctionValidator";

const router = Router();

router.get("/", getAuctions);
router.get("/:id", getAuctionById);
router.post("/", protect, createAuctionValidator, validateRequest, createAuction);
router.put("/:id", protect, updateAuctionValidator, validateRequest, updateAuction);
router.delete("/:id", protect, deleteAuction);

// Lifecycle controls
router.post("/:id/start", protect, startAuction);
router.post("/:id/pause", protect, pauseAuction);
router.post("/:id/resume", protect, resumeAuction);
router.post("/:id/end", protect, endAuction);
router.post("/:id/reset", protect, resetAuction);

// Lot controls
router.post("/:id/next-lot", protect, nextLot);
router.post("/:id/sold", protect, markSold);
router.post("/:id/unsold", protect, markUnsold);

export default router;
