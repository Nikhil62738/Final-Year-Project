import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";

const uploadDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${nanoid(8)}${ext}`);
  }
});

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"]);

export const uploadEvidence = multer({
  storage,
  limits: { files: 5, fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowed.has(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WebP, MP4, and MOV evidence files are allowed"));
    }
    cb(null, true);
  }
});
