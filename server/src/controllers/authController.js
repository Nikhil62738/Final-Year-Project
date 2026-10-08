import jwt from "jsonwebtoken";
import Officer from "../models/Officer.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/email.js";
import { sendSMS } from "../utils/sms.js";
import { sendMCOtp, validateMCOtp } from "../utils/messagecentral.js";
import { recordSessionLog } from "./logController.js";

const MAHARASHTRA_DISTRICTS = [
  "Ahmednagar",
  "Akola",
  "Amravati",
  "Aurangabad",
  "Beed",
  "Bhandara",
  "Buldhana",
  "Chandrapur",
  "Dhule",
  "Gadchiroli",
  "Gondia",
  "Hingoli",
  "Jalgaon",
  "Jalna",
  "Kolhapur",
  "Latur",
  "Mumbai City",
  "Mumbai Suburban",
  "Nagpur",
  "Nanded",
  "Nandurbar",
  "Nashik",
  "Osmanabad",
  "Palghar",
  "Parbhani",
  "Pune",
  "Raigad",
  "Ratnagiri",
  "Sangli",
  "Satara",
  "Sindhudurg",
  "Solapur",
  "Thane",
  "Wardha",
  "Washim",
  "Yavatmal"
];

function signOfficerToken(officer) {
  return jwt.sign(
    { id: officer.id, role: officer.role, district: officer.district },
    process.env.JWT_SECRET || "dev-secret-change-me",
    { expiresIn: "8h" }
  );
}

function signUserToken(user) {
  return jwt.sign(
    { id: user.id, role: "user" },
    process.env.JWT_SECRET || "dev-secret-change-me",
    { expiresIn: "8h" }
  );
}

export async function login(req, res) {
  const { phone, email, password } = req.body;
  const identifier = email || phone;

  if (!identifier || !password) {
    return res.status(400).json({ message: "Email/Phone and password are required" });
  }

  const officer = await Officer.findOne({
    $or: [{ email: String(identifier).toLowerCase() }, { phone: identifier }]
  });

  if (!officer || !(await officer.matchPassword(password))) {
    recordSessionLog({
      userType: "officer",
      name: identifier,
      email: identifier,
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "Web Browser",
      status: "failed",
      failureReason: "Invalid officer credentials"
    });
    return res.status(401).json({ message: "Invalid officer credentials" });
  }

  recordSessionLog({
    userType: "officer",
    userId: officer._id,
    name: officer.name,
    email: officer.email,
    phone: officer.phone,
    role: officer.role,
    district: officer.district,
    ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
    userAgent: req.headers["user-agent"] || "Web Browser",
    status: "success"
  });

  res.json({
    token: signOfficerToken(officer),
    officer: {
      id: officer.id,
      name: officer.name,
      email: officer.email,
      role: officer.role,
      district: officer.district
    }
  });
}

export async function registerUser(req, res) {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: "Name, email, mobile number, and password are required" });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Enter a valid email address" });
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ message: "Enter a valid 10-digit Indian mobile number" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
  if (existing) {
    return res.status(409).json({ message: "A user with this email or mobile number is already registered" });
  }

  const user = await User.create({
    name,
    email,
    phone,
    passwordHash: await bcrypt.hash(password, 12)
  });

  // Send Welcome SMS & Email to newly registered citizen
  if (user.phone) {
    sendSMS({
      to: user.phone,
      message: `Welcome to Aarogya Food Safety Portal, ${user.name}! Your account has been created successfully. Report & track food grievances anytime.`
    }).catch((err) => console.error("Register SMS error:", err));
  }

  if (user.email) {
    sendEmail({
      to: user.email,
      subject: "Welcome to Aarogya Food Safety Grievance Portal",
      html: `
        <h2 style="color: #0f172a; margin-top: 0;">Welcome, ${user.name}!</h2>
        <p>Your citizen account on <strong>Aarogya Food Safety Portal</strong> has been registered successfully.</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Registered Mobile:</strong> ${user.phone}</p>
          <p style="margin: 4px 0;"><strong>Registered Email:</strong> ${user.email}</p>
        </div>
        <p>You can now report food adulteration, hygiene violations, and track status in real-time.</p>
      `
    }).catch((err) => console.error("Register Email error:", err));
  }

  res.status(201).json({
    token: signUserToken(user),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      rewardPoints: user.rewardPoints,
      role: "user"
    }
  });
}

export async function loginUser(req, res) {
  const { emailOrPhone, password } = req.body;

  if (!emailOrPhone || !password) {
    return res.status(400).json({ message: "Email/mobile and password are required" });
  }

  const user = await User.findOne({
    $or: [{ email: String(emailOrPhone).toLowerCase() }, { phone: emailOrPhone }]
  });

  if (!user || !user.active || !(await user.matchPassword(password))) {
    recordSessionLog({
      userType: "user",
      name: emailOrPhone,
      email: emailOrPhone,
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "Web Browser",
      status: "failed",
      failureReason: "Invalid citizen credentials"
    });
    return res.status(401).json({ message: "Invalid user credentials" });
  }

  recordSessionLog({
    userType: "user",
    userId: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: "user",
    ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
    userAgent: req.headers["user-agent"] || "Web Browser",
    status: "success"
  });

  res.json({
    token: signUserToken(user),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      rewardPoints: user.rewardPoints,
      role: "user"
    }
  });
}

export async function googleAuthUser(req, res) {
  try {
    let { email, name, googleId, avatar, credential } = req.body;

    if (credential && (!email || !name)) {
      try {
        const parts = credential.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
          if (payload.email) email = payload.email;
          if (payload.name) name = payload.name;
          if (payload.sub) googleId = payload.sub;
          if (payload.picture) avatar = payload.picture;
        }
      } catch (err) {
        console.error("Failed to parse Google credential:", err);
      }
    }

    if (!email) {
      return res.status(400).json({ message: "Google account email is required" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    let user = await User.findOne({
      $or: [{ email: normalizedEmail }, ...(googleId ? [{ googleId }] : [])]
    });

    if (user) {
      if (!user.active) {
        return res.status(403).json({ message: "Your account is deactivated. Contact administration." });
      }
      let updated = false;
      if (!user.googleId && googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (!user.avatar && avatar) {
        user.avatar = avatar;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    } else {
      user = await User.create({
        name: name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        googleId: googleId || `google_${Date.now()}`,
        avatar: avatar || "",
        authProvider: "google"
      });
    }

    res.json({
      token: signUserToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        avatar: user.avatar || "",
        authProvider: user.authProvider || "google",
        role: "user"
      }
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ message: error.message || "Failed to authenticate with Google" });
  }
}

export async function createSubAdmin(req, res) {
  if (req.officer.role !== "super_admin") {
    return res.status(403).json({ message: "Only super admin can create district subadmins" });
  }

  try {
    const { name, email, phone, password, district } = req.body;

    if (!name || !email || !password || !district) {
      return res.status(400).json({ message: "Name, email, password, and district are required" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    if (!MAHARASHTRA_DISTRICTS.includes(district)) {
      return res.status(400).json({ message: "Select a valid Maharashtra district" });
    }

    // Enforce 1 admin per district rule — exclude super_admin from this check
    const existingDistrictAdmin = await Officer.findOne({ district, active: true, role: { $ne: "super_admin" } });
    if (existingDistrictAdmin) {
      return res.status(400).json({ message: `District '${district}' already has an active admin (${existingDistrictAdmin.name}). Edit or delete the existing admin first.` });
    }

    const existingEmail = await Officer.findOne({ email: String(email).toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ message: "An admin with this email already exists" });
    }

    // Use phone if provided, otherwise derive a unique placeholder from email
    const phoneValue = phone && phone.trim() ? phone.trim() : `ph_${String(email).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 14)}`;

    const officer = await Officer.create({
      name,
      email: String(email).toLowerCase(),
      phone: phoneValue,
      district,
      role: "admin",
      passwordHash: await bcrypt.hash(password, 12)
    });

    res.status(201).json({
      officer: {
        id: officer.id,
        name: officer.name,
        email: officer.email,
        role: officer.role,
        district: officer.district
      }
    });
  } catch (error) {
    console.error("createSubAdmin error:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(409).json({ message: `An admin with this ${field} already exists.` });
    }
    res.status(500).json({ message: error.message || "Failed to create district admin" });
  }
}

export async function listSubAdmins(req, res) {
  if (req.officer.role !== "super_admin") {
    return res.status(403).json({ message: "Only super admin can view district subadmins" });
  }

  const officers = await Officer.find({ role: { $in: ["admin", "field_officer"] } })
    .select("-passwordHash")
    .sort({ createdAt: -1 });

  res.json(officers);
}

export async function updateSubAdmin(req, res) {
  if (req.officer.role !== "super_admin") {
    return res.status(403).json({ message: "Only super admin can edit district subadmins" });
  }

  const { id } = req.params;
  const { name, email, phone, password, district } = req.body;

  const officer = await Officer.findById(id);
  if (!officer) {
    return res.status(404).json({ message: "District admin not found" });
  }

  if (district && district !== officer.district) {
    const existingDistrictAdmin = await Officer.findOne({ district, _id: { $ne: id }, active: true });
    if (existingDistrictAdmin) {
      return res.status(400).json({ message: `District '${district}' already has an active admin (${existingDistrictAdmin.name}).` });
    }
    officer.district = district;
  }

  if (name) officer.name = name;
  if (email) officer.email = String(email).toLowerCase();
  if (phone) officer.phone = phone;
  if (password) officer.passwordHash = await bcrypt.hash(password, 12);

  await officer.save();
  res.json({ message: "District admin updated successfully", officer });
}

export async function deleteSubAdmin(req, res) {
  if (req.officer.role !== "super_admin") {
    return res.status(403).json({ message: "Only super admin can delete district subadmins" });
  }

  const { id } = req.params;
  const officer = await Officer.findByIdAndDelete(id);
  if (!officer) {
    return res.status(404).json({ message: "District admin not found" });
  }

  res.json({ message: "District admin deleted successfully" });
}

export async function requestOtp(req, res) {
  const { email, phone, emailOrPhone } = req.body;
  const identifier = emailOrPhone || email || phone;
  if (!identifier) return res.status(400).json({ message: "Email or mobile number is required" });

  const user = await User.findOne({
    $or: [{ email: String(identifier).toLowerCase() }, { phone: identifier }]
  });
  if (!user || !user.active) {
    return res.status(404).json({ message: "User account not found or inactive" });
  }

  let smsSent = false;
  let emailSent = false;

  // --- Mobile OTP via Message Central VerifyNow ---
  if (user.phone) {
    try {
      const mc = await sendMCOtp(user.phone);
      user.mcVerificationId = mc.verificationId;
      // Clear old email-based OTP since we're using MC for phone
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
      smsSent = true;
      console.log(`[MC VerifyNow] Login OTP sent to ${user.phone}`);
    } catch (err) {
      console.error("[MC VerifyNow] Send OTP error:", err.message);
      // Fallback: generate & store OTP manually and send via SMS
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60000);
      user.mcVerificationId = undefined;
      await user.save();
      sendSMS({ to: user.phone, message: `Your Aarogya Portal Login OTP is: ${otp}. Valid for 10 minutes.` })
        .catch((e) => console.error("SMS fallback error:", e));
      smsSent = true;
    }
  }

  // --- Email OTP (always sent alongside as a backup) ---
  if (user.email) {
    // Generate a backup OTP only if MC didn't handle it (no phone)
    if (!user.phone) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60000);
      await user.save();
    }
    sendEmail({
      to: user.email,
      subject: "Your Aarogya Portal Login OTP",
      html: `
        <h2 style="color: #0f172a; margin-top: 0;">Login Verification Code</h2>
        <p>Hello ${user.name || "Citizen"},</p>
        <p>Your One-Time Password (OTP) for secure login has been sent to your registered mobile number.</p>
        <p style="color: #64748b; font-size: 13px;">If you did not receive the SMS, please check the spam folder or request a new OTP.</p>
      `
    }).catch((err) => console.error("Email OTP notify error:", err));
    emailSent = true;
  }

  res.json({
    message: smsSent && emailSent
      ? `OTP sent to your mobile (${user.phone}) via Message Central. A notification has also been sent to ${user.email}.`
      : smsSent
        ? `OTP sent to your registered mobile (${user.phone}) via Message Central.`
        : `OTP sent to your registered email (${user.email}).`
  });
}

export async function verifyOtp(req, res) {
  const { email, phone, emailOrPhone, otp } = req.body;
  const identifier = emailOrPhone || email || phone;
  if (!identifier || !otp) return res.status(400).json({ message: "Email/mobile number and OTP are required" });

  const user = await User.findOne({
    $or: [{ email: String(identifier).toLowerCase() }, { phone: identifier }]
  });
  if (!user || !user.active) {
    return res.status(404).json({ message: "User account not found or inactive" });
  }

  // --- Verify via Message Central VerifyNow (phone-based OTP) ---
  if (user.mcVerificationId) {
    try {
      await validateMCOtp(user.mcVerificationId, otp, user.phone);
      user.mcVerificationId = undefined;
      await user.save();
    } catch (err) {
      return res.status(401).json({ message: err.message || "Invalid or expired OTP" });
    }
  } else {
    // --- Fallback: verify against locally stored OTP ---
    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
  }

  res.json({
    token: signUserToken(user),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      rewardPoints: user.rewardPoints,
      role: "user"
    }
  });
}

export async function requestPasswordResetOtp(req, res) {
  const { emailOrPhone, role } = req.body;
  if (!emailOrPhone) return res.status(400).json({ message: "Email or mobile number is required" });

  let account = null;
  if (role === "admin") {
    account = await Officer.findOne({ $or: [{ phone: emailOrPhone }, { email: String(emailOrPhone).toLowerCase() }] });
  } else {
    account = await User.findOne({ $or: [{ phone: emailOrPhone }, { email: String(emailOrPhone).toLowerCase() }] });
  }

  if (!account || !account.active) {
    return res.status(404).json({ message: "Account not found or inactive" });
  }

  if (!account.email && !account.phone) {
    return res.status(400).json({ message: "No email or mobile number linked to this account for OTP delivery" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  account.resetOtp = otp;
  account.resetOtpExpires = new Date(Date.now() + 10 * 60000);
  await account.save();

  // --- Mobile OTP via Message Central VerifyNow for password reset ---
  if (account.phone) {
    try {
      const mc = await sendMCOtp(account.phone);
      account.mcResetVerificationId = mc.verificationId;
      account.resetOtp = undefined;
      account.resetOtpExpires = undefined;
      await account.save();
      console.log(`[MC VerifyNow] Password reset OTP sent to ${account.phone}`);
    } catch (err) {
      console.error("[MC VerifyNow] Reset OTP error:", err.message);
      // Fallback: SMS with manually generated OTP (already saved above)
      sendSMS({ to: account.phone, message: `Your Aarogya Password Reset OTP is: ${otp}. Valid for 10 minutes.` })
        .catch((e) => console.error("Reset SMS fallback error:", e));
    }
  }

  // Send Email OTP
  if (account.email) {
    sendEmail({
      to: account.email,
      subject: "Your Password Reset OTP - Aarogya",
      html: `
        <h2 style="color: #0f172a; margin-top: 0;">Password Reset Request</h2>
        <p>Your One-Time Password to reset your password is:</p>
        <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px; text-align: center; margin: 16px 0;">
          <span style="font-family: monospace; font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #2563eb;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">It will expire in 10 minutes.</p>
      `
    }).catch((err) => console.error("Reset Email error:", err));
  }

  res.json({
    message: account.phone && account.email
      ? `Password reset OTP sent to your mobile (${account.phone}) and email (${account.email})`
      : account.phone
        ? `Password reset OTP sent to your mobile (${account.phone})`
        : `Password reset OTP sent to your email (${account.email})`
  });
}

export async function verifyPasswordReset(req, res) {
  const { emailOrPhone, role, otp, newPassword } = req.body;
  if (!emailOrPhone || !otp || !newPassword) return res.status(400).json({ message: "Missing required fields" });

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  let account = null;
  if (role === "admin") {
    account = await Officer.findOne({ $or: [{ phone: emailOrPhone }, { email: String(emailOrPhone).toLowerCase() }] });
  } else {
    account = await User.findOne({ $or: [{ phone: emailOrPhone }, { email: String(emailOrPhone).toLowerCase() }] });
  }

  if (!account || !account.active) {
    return res.status(404).json({ message: "Account not found or inactive" });
  }

  // --- Verify via Message Central VerifyNow (phone-based reset OTP) ---
  if (account.mcResetVerificationId) {
    try {
      await validateMCOtp(account.mcResetVerificationId, otp, account.phone);
      account.mcResetVerificationId = undefined;
    } catch (err) {
      return res.status(401).json({ message: err.message || "Invalid or expired OTP" });
    }
  } else {
    // --- Fallback: verify against locally stored OTP ---
    if (account.resetOtp !== otp || account.resetOtpExpires < new Date()) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }
    account.resetOtp = undefined;
    account.resetOtpExpires = undefined;
  }

  account.passwordHash = await bcrypt.hash(newPassword, 12);
  await account.save();

  res.json({ message: "Password successfully reset" });
}

export { MAHARASHTRA_DISTRICTS };
