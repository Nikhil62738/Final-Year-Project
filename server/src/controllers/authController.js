import jwt from "jsonwebtoken";
import Officer from "../models/Officer.js";

function signToken(officer) {
  return jwt.sign(
    { id: officer.id, role: officer.role, district: officer.district },
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
    token: signToken(officer),
    officer: {
      id: officer.id,
      name: officer.name,
      role: officer.role,
      district: officer.district
    }
  });
}
