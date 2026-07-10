import { Router } from "express";
import {
  getPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer,
  importPlayersCsv,
  bulkUploadPhotos,
} from "../controllers/playerController";
import { protect } from "../middleware/authMiddleware";
import { upload, uploadCsv } from "../middleware/uploadMiddleware";
import { validateRequest } from "../middleware/validateMiddleware";
import { createPlayerValidator, updatePlayerValidator, listPlayersValidator } from "../validators/playerValidator";

const router = Router();

router.get("/", listPlayersValidator, validateRequest, getPlayers);
// Registered before "/:id" so "import"/"photos" are never swallowed as an id param.
router.post("/import", protect, uploadCsv.single("file"), importPlayersCsv);
router.post("/photos/bulk", protect, upload.array("photos", 100), bulkUploadPhotos);
router.get("/:id", getPlayerById);
router.post("/", protect, upload.single("photo"), createPlayerValidator, validateRequest, createPlayer);
router.put("/:id", protect, upload.single("photo"), updatePlayerValidator, validateRequest, updatePlayer);
router.delete("/:id", protect, deletePlayer);

export default router;
