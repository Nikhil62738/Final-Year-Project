import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OfficerRepository } from "../repositories/OfficerRepository.js";

const officers = new OfficerRepository();

export async function login(req, res) {
  const { username, phone, email, password } = req.body;
  const officer = officers.findByUsername(username || phone || email || "");
  if (!officer || !(await bcrypt.compare(password || "", officer.passwordHash))) {
    return res.status(401).json({ success: false, error: { code: "INVALID_LOGIN", message: "The username or password is incorrect." } });
  }
  const token = jwt.sign({ id: officer.id, role: officer.role, district: officer.district }, process.env.JWT_SECRET || "change_me", { expiresIn: process.env.JWT_EXPIRES_IN || "8h" });
  res.json({ success: true, data: { token, officer: { id: officer.id, name: officer.name, role: officer.role, district: officer.district } } });
}
