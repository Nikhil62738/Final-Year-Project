import express from "express";
import { getVendorProfile, listVendorRankings } from "../controllers/vendorController.js";

const router = express.Router();

router.get("/profile/:query", getVendorProfile);
router.get("/rankings", listVendorRankings);

export default router;
