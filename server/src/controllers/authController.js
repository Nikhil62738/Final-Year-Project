import jwt from "jsonwebtoken";
import Officer from "../models/Officer.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/email.js";

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
    return res.status(401).json({ message: "Invalid officer credentials" });
  }

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

  res.status(201).json({
    token: signUserToken(user),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
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
    return res.status(401).json({ message: "Invalid user credentials" });
  }

  res.json({
    token: signUserToken(user),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: "user"
    }
  });
}

export async function createSubAdmin(req, res) {
  if (req.officer.role !== "super_admin") {
    return res.status(403).json({ message: "Only super admin can create district subadmins" });
  }

  const { name, email, phone, password, district } = req.body;

  if (!name || !phone || !password || !district) {
    return res.status(400).json({ message: "Name, phone, password, and district are required" });
  }

  if (!MAHARASHTRA_DISTRICTS.includes(district)) {
    return res.status(400).json({ message: "Select a valid Maharashtra district" });
  }

  // Enforce 1 admin per district rule
  const existingDistrictAdmin = await Officer.findOne({ district, active: true });
  if (existingDistrictAdmin) {
    return res.status(400).json({ message: `District '${district}' already has an active admin (${existingDistrictAdmin.name}). Edit or delete the existing admin first.` });
  }

  const existingPhone = await Officer.findOne({ phone });
  if (existingPhone) {
    return res.status(409).json({ message: "An admin with this phone already exists" });
  }

  let finalEmail = email;
  if (!finalEmail) {
    const slug = district.toLowerCase().replace(/[^a-z0-9]/g, "");
    finalEmail = `${slug}@gmail.com`;
  }

  const officer = await Officer.create({
    name,
    email: finalEmail,
    phone,
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
  const { name, phone, password, district } = req.body;

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
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user || !user.active) {
    return res.status(404).json({ message: "User not found or inactive" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + 10 * 60000);
  await user.save();

  await sendEmail({
    to: user.email,
    subject: "Your SwiftCivic Login OTP",
    html: `<p>Your One-Time Password for login is: <strong>${otp}</strong></p><p>It will expire in 10 minutes.</p>`
  });

  res.json({ message: "OTP sent to your email" });
}

export async function verifyOtp(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user || !user.active) {
    return res.status(404).json({ message: "User not found or inactive" });
  }

  if (user.otp !== otp || user.otpExpires < new Date()) {
    return res.status(401).json({ message: "Invalid or expired OTP" });
  }

  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  res.json({
    token: signUserToken(user),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
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

  if (!account.email) {
    return res.status(400).json({ message: "No email address is linked to this account for OTP delivery" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  account.resetOtp = otp;
  account.resetOtpExpires = new Date(Date.now() + 10 * 60000);
  await account.save();

  await sendEmail({
    to: account.email,
    subject: "Your Password Reset OTP",
    html: `<p>Your One-Time Password to reset your password is: <strong>${otp}</strong></p><p>It will expire in 10 minutes.</p>`
  });

  res.json({ message: "Password reset OTP sent to your email" });
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

  if (account.resetOtp !== otp || account.resetOtpExpires < new Date()) {
    return res.status(401).json({ message: "Invalid or expired OTP" });
  }

  account.passwordHash = await bcrypt.hash(newPassword, 12);
  account.resetOtp = undefined;
  account.resetOtpExpires = undefined;
  await account.save();

  res.json({ message: "Password successfully reset" });
}

export { MAHARASHTRA_DISTRICTS };
