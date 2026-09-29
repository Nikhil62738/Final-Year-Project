import express from "express";
import { getSafetyAlerts, createSafetyAlert } from "../controllers/safetyAlertController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getSafetyAlerts);
router.post("/", protect, createSafetyAlert);

export default router;
