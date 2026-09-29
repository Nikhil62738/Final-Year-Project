import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ["normal", "high", "urgent"],
      default: "normal"
    },
    targetAudience: {
      type: String,
      enum: ["all_district_admins", "all_officers", "district_specific", "public"],
      default: "all_district_admins"
    },
    targetDistrict: { type: String, default: "All", trim: true },
    createdById: { type: mongoose.Schema.Types.ObjectId, ref: "Officer", required: true },
    createdByName: { type: String, required: true, trim: true },
    readBy: [
      {
        officerId: { type: mongoose.Schema.Types.ObjectId, ref: "Officer" },
        readAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Announcement", announcementSchema);
