import express from "express";
import { createSubAdmin, deleteSubAdmin, listSubAdmins, login, loginUser, registerUser, requestOtp, updateSubAdmin, verifyOtp, requestPasswordResetOtp, verifyPasswordReset } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/users/register", registerUser);
router.post("/users/login", loginUser);
router.post("/users/otp/request", requestOtp);
router.post("/users/otp/verify", verifyOtp);
router.post("/users/forgot-password/request", requestPasswordResetOtp);
router.post("/users/forgot-password/verify", verifyPasswordReset);
router.post("/subadmins", protect, createSubAdmin);
router.get("/subadmins", protect, listSubAdmins);
router.put("/subadmins/:id", protect, updateSubAdmin);
router.delete("/subadmins/:id", protect, deleteSubAdmin);

export default router;
