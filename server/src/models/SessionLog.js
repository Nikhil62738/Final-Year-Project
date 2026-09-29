import mongoose from "mongoose";

const sessionLogSchema = new mongoose.Schema(
  {
    userType: { type: String, enum: ["officer", "user"], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    role: { type: String, trim: true },
    district: { type: String, trim: true },
    ipAddress: { type: String, default: "127.0.0.1" },
    userAgent: { type: String, default: "Unknown Browser" },
    deviceType: { type: String, default: "Desktop / Web" },
    status: { type: String, enum: ["success", "failed"], default: "success" },
    failureReason: { type: String, default: "" },
    loginTime: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

sessionLogSchema.index({ loginTime: -1 });

export default mongoose.model("SessionLog", sessionLogSchema);
