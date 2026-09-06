import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protectUser(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Login required to report an issue" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-change-me");

    if (payload.role !== "user") {
      return res.status(403).json({ message: "Citizen account required" });
    }

    const user = await User.findById(payload.id).select("-passwordHash");

    if (!user || !user.active) {
      return res.status(401).json({ message: "User account unavailable" });
    }

    req.user = user;
    next();
  } catch (_error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
