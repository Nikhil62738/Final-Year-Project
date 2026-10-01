import express from "express";
import {
  checkDuplicates,
  createComplaint,
  getComplaint,
  listComplaints,
  listMyHistory,
  listPublicComplaints,
  trackComplaint,
  updateComplaintStatus,
  voteComplaint,
  rateComplaint,
  resubmitComplaint,
  getOfficerWorkload
} from "../controllers/complaintController.js";
import { protect } from "../middleware/authMiddleware.js";
import { protectUser } from "../middleware/userAuthMiddleware.js";
import { uploadEvidence } from "../middleware/upload.js";

const router = express.Router();

router.get("/public", listPublicComplaints);
router.get("/history", protectUser, listMyHistory);
router.get("/workload", protect, getOfficerWorkload);
router.post("/:id/rate", protectUser, rateComplaint);
router.post("/:id/resubmit", protectUser, resubmitComplaint);
router.post("/:id/vote", protectUser, voteComplaint);
router.post("/check-duplicates", protectUser, checkDuplicates);
router.post("/", protectUser, uploadEvidence.array("evidence", 5), createComplaint);
router.get("/track/:trackingCode", trackComplaint);
router.get("/", protect, listComplaints);
router.get("/:id", protect, getComplaint);
router.patch("/:id/status", protect, uploadEvidence.array("proofMedia", 5), updateComplaintStatus);

export default router;
