import express from "express";
import { getAnnouncements, createAnnouncement, markAnnouncementRead } from "../controllers/announcementController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getAnnouncements);
router.post("/", protect, createAnnouncement);
router.post("/:id/read", protect, markAnnouncementRead);

export default router;
