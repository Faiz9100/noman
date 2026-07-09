import { Router } from "express";
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
} from "../controllers/teamController";
import { protect } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";
import { validateRequest } from "../middleware/validateMiddleware";
import { createTeamValidator, updateTeamValidator } from "../validators/teamValidator";

const router = Router();

router.get("/", getTeams);
router.get("/:id", getTeamById);
router.post("/", protect, upload.single("logo"), createTeamValidator, validateRequest, createTeam);
router.put("/:id", protect, upload.single("logo"), updateTeamValidator, validateRequest, updateTeam);
router.delete("/:id", protect, deleteTeam);

export default router;
