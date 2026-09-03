import jwt from "jsonwebtoken";
import { OfficerRepository } from "../repositories/OfficerRepository.js";

const officers = new OfficerRepository();

export function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(401).json({ success: false, error: { code: "AUTH_REQUIRED", message: "Please sign in." } });
    const payload = jwt.verify(token, process.env.JWT_SECRET || "change_me");
    const officer = officers.findById(payload.id);
    if (!officer || !officer.active) return res.status(401).json({ success: false, error: { code: "AUTH_INVALID", message: "Please sign in again." } });
    req.officer = { id: officer.id, name: officer.name, role: officer.role, district: officer.district };
    next();
  } catch {
    res.status(401).json({ success: false, error: { code: "AUTH_INVALID", message: "Please sign in again." } });
  }
}

export function adminOnly(req, res, next) {
  if (req.officer?.role !== "admin") return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "You do not have access to this action." } });
  next();
}
