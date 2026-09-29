import express from "express";
import { getSessionLogs } from "../controllers/logController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/sessions", protect, getSessionLogs);

export default router;
