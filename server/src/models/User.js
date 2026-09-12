import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, sparse: true },
    passwordHash: { type: String },
    googleId: { type: String, sparse: true },
    avatar: { type: String },
    authProvider: { type: String, default: "local" },
    active: { type: Boolean, default: true },
    otp: { type: String },
    otpExpires: { type: Date },
    mcVerificationId: { type: String },   // Message Central VerifyNow session ID
    resetOtp: { type: String },
    resetOtpExpires: { type: Date },
    mcResetVerificationId: { type: String } // MC session ID for password reset OTP
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = function matchPassword(password) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model("User", userSchema);
