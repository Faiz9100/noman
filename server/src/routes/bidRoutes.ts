import { Router } from "express";
import { placeBid, getBids, getBidById } from "../controllers/bidController";
import { protect } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validateMiddleware";
import { createBidValidator, listBidsValidator } from "../validators/bidValidator";

const router = Router();

router.get("/", listBidsValidator, validateRequest, getBids);
router.get("/:id", getBidById);
router.post("/", protect, createBidValidator, validateRequest, placeBid);

export default router;
