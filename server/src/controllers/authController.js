import jwt from "jsonwebtoken";
import Officer from "../models/Officer.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

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
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: "Phone and password are required" });
  }

  const officer = await Officer.findOne({ phone });
  if (!officer || !(await officer.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid officer credentials" });
  }

  res.json({
    token: signOfficerToken(officer),
    officer: {
      id: officer.id,
      name: officer.name,
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

  const { name, phone, password, district } = req.body;

  if (!name || !phone || !password || !district) {
    return res.status(400).json({ message: "Name, phone, password, and district are required" });
  }

  if (!MAHARASHTRA_DISTRICTS.includes(district)) {
    return res.status(400).json({ message: "Select a valid Maharashtra district" });
  }

  const existing = await Officer.findOne({ phone });
  if (existing) {
    return res.status(409).json({ message: "An admin with this phone already exists" });
  }

  const officer = await Officer.create({
    name,
    phone,
    district,
    role: "admin",
    passwordHash: await bcrypt.hash(password, 12)
  });

  res.status(201).json({
    officer: {
      id: officer.id,
      name: officer.name,
      role: officer.role,
      district: officer.district
    }
  });
}

export { MAHARASHTRA_DISTRICTS };
