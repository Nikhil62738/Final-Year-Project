import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const officerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, sparse: true },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["super_admin", "admin", "field_officer"], default: "field_officer" },
    district: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
    resetOtp: { type: String },
    resetOtpExpires: { type: Date }
  },
  { timestamps: true }
);

officerSchema.methods.matchPassword = function matchPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model("Officer", officerSchema);
