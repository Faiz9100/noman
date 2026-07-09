import { Router } from "express";
import { getHistory, getHistoryStats, exportHistoryCsv, getHistoryById, undoHistory } from "../controllers/historyController";
import { protect } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validateMiddleware";
import { listHistoryValidator } from "../validators/historyValidator";

const router = Router();

// Specific paths before "/:id" so they're never swallowed as an id param.
router.get("/stats", getHistoryStats);
router.get("/export", protect, exportHistoryCsv);
router.get("/", listHistoryValidator, validateRequest, getHistory);
router.get("/:id", getHistoryById);
router.delete("/:id", protect, undoHistory);

export default router;
