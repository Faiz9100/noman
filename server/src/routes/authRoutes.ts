import { Router } from "express";
import {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  getMe,
  updateProfile,
  changePassword,
} from "../controllers/authController";
import { protect, authorize } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validateMiddleware";
import {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  changePasswordValidator,
} from "../validators/authValidator";

const router = Router();

// No public sign-up: only a signed-in admin can create another admin account.
router.post("/register", protect, authorize("admin", "superadmin"), registerValidator, validateRequest, registerAdmin);
router.post("/login", loginValidator, validateRequest, loginAdmin);
router.post("/logout", protect, logoutAdmin);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfileValidator, validateRequest, updateProfile);
router.put("/password", protect, changePasswordValidator, validateRequest, changePassword);

export default router;
