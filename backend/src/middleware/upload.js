import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.join(here, "..", "..", "uploads");

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME_PREFIXES = ["image/", "video/", "audio/"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(UPLOADS_DIR, req.userId);
    fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

export const uploadMedia = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_PREFIXES.some((p) => file.mimetype.startsWith(p))) {
      cb(null, true);
    } else {
      cb(new Error("Only image, video or audio files are allowed"));
    }
  },
});

export function mediaTypeFromMime(mimetype) {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  return "audio";
}
