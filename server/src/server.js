import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDb } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.join(__dirname, "..", "..", "client");

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com", "https://maps.googleapis.com", "https://maps.gstatic.com", "https://cdnjs.cloudflare.com", "https://accounts.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://maps.gstatic.com", "https://maps.googleapis.com", "https://*.tile.openstreetmap.org", "https://unpkg.com", "https://*.googleusercontent.com"],
        mediaSrc: ["'self'", "blob:"],
        connectSrc: ["'self'", "https://maps.googleapis.com", "https://cdnjs.cloudflare.com", "https://unpkg.com", "https://accounts.google.com"],
        frameSrc: ["'self'", "https://accounts.google.com"]
      }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",") || "*", credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/config.js", (_req, res) => {
  res.type("application/javascript").send(
    `window.SAFEWATCH_GOOGLE_MAPS_API_KEY=${JSON.stringify(process.env.GOOGLE_MAPS_API_KEY || "")};\n` +
    `window.SAFEWATCH_GOOGLE_CLIENT_ID=${JSON.stringify(process.env.GOOGLE_CLIENT_ID || "")};`
  );
});

app.use(express.static(clientDir));
app.use(express.static(path.join(clientDir, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "FDA SafeWatch API" });
});

app.get("/api/geocode", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "Missing q parameter" });
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "FDA-SafeWatch/1.0 (contact@maharashtra.gov.in)" }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Geocoding failed" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);

app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(clientDir, "index.html"));
});

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;

connectDb().then(() => {
  app.listen(port, () => {
    console.log(`FDA SafeWatch API listening on http://localhost:${port}`);
  });
});
