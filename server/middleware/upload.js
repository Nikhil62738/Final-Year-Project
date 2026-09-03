import fs from "fs";
import path from "path";
import multer from "multer";
import { customAlphabet } from "nanoid";

const safeId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);
const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"]);
const maxSizeMb = Number(process.env.MAX_FILE_SIZE_MB || 20);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${safeId()}${path.extname(file.originalname).toLowerCase()}`)
});

export const uploadEvidence = multer({
  storage,
  limits: { files: 5, fileSize: maxSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => allowed.has(file.mimetype)
    ? cb(null, true)
    : cb(Object.assign(new Error("This file type is not supported. Please upload JPG, PNG, WEBP, MP4 or MOV."), { statusCode: 400 }))
});
