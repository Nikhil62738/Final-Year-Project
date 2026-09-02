import express from "express";
import {
  checkDuplicates,
  createComplaint,
  getComplaint,
  listComplaints,
  trackComplaint,
  updateComplaintStatus
} from "../controllers/complaintController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadEvidence } from "../middleware/upload.js";

const router = express.Router();

router.post("/check-duplicates", checkDuplicates);
router.post("/", uploadEvidence.array("evidence", 5), createComplaint);
router.get("/track/:trackingCode", trackComplaint);
router.get("/", protect, listComplaints);
router.get("/:id", protect, getComplaint);
router.patch("/:id/status", protect, updateComplaintStatus);

export default router;
