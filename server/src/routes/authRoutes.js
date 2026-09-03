import express from "express";
import { createSubAdmin, login, loginUser, registerUser } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/users/register", registerUser);
router.post("/users/login", loginUser);
router.post("/subadmins", protect, createSubAdmin);

export default router;
