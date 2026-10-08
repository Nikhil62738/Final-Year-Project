import express from "express";
import { listMyNotifications, markNotificationRead } from "../controllers/notificationController.js";
import { protectUser } from "../middleware/userAuthMiddleware.js";

const router = express.Router();

router.get("/me", protectUser, listMyNotifications);
router.patch("/:id/read", protectUser, markNotificationRead);

export default router;
