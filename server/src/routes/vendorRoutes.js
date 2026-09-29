import express from "express";
import { getVendorProfile } from "../controllers/vendorController.js";

const router = express.Router();

router.get("/profile/:query", getVendorProfile);

export default router;
