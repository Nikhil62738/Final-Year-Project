import mongoose from "mongoose";

const safetyAlertSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    details: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["food_recall", "adulteration_warning", "fssai_advisory", "seasonal_alert", "hygiene_warning"],
      default: "food_recall"
    },
    severity: {
      type: String,
      enum: ["critical", "warning", "info"],
      default: "warning"
    },
    affectedProduct: { type: String, trim: true },
    batchNumber: { type: String, trim: true },
    district: { type: String, default: "All Maharashtra", trim: true },
    issuedBy: { type: String, default: "FDA Maharashtra", trim: true },
    issuedDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["active", "resolved", "recalled"],
      default: "active"
    },
    recommendedAction: { type: String, trim: true }
  },
  { timestamps: true }
);

export default mongoose.model("SafetyAlert", safetyAlertSchema);
