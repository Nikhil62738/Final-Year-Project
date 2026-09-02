import jwt from "jsonwebtoken";
import Officer from "../models/Officer.js";

export async function protect(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-change-me");
    const officer = await Officer.findById(payload.id).select("-passwordHash");

    if (!officer || !officer.active) {
      return res.status(401).json({ message: "Officer account unavailable" });
    }

    req.officer = officer;
    next();
  } catch (_error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
