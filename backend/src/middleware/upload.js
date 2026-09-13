import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.join(here, "..", "..", "uploads");

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME_PREFIXES = ["image/", "video/", "audio/"];

// Marks fileFilter rejections so the server's error middleware can return a
// clean 400 instead of a generic 500 (see server.js).
function rejectedFileType(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

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
      cb(rejectedFileType("Only image, video or audio files are allowed"));
    }
  },
});

export function mediaTypeFromMime(mimetype) {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  return "audio";
}

// Release uploads (discography): one or more MP3s sharing a single cover
// image — a single, EP or LP — deliberately restricted to keep files small
// on the free hosting tier.
const releaseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const releaseDir = path.join(UPLOADS_DIR, req.userId, "releases");
    fs.mkdirSync(releaseDir, { recursive: true });
    cb(null, releaseDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const MAX_TRACKS_PER_RELEASE = 20;

export const uploadRelease = multer({
  storage: releaseStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB per file
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "audio" && file.mimetype === "audio/mpeg") {
      return cb(null, true);
    }
    if (file.fieldname === "cover" && file.mimetype === "image/jpeg") {
      return cb(null, true);
    }
    cb(rejectedFileType("Tracks must be MP3 files and the cover must be a JPG image"));
  },
}).fields([
  { name: "audio", maxCount: MAX_TRACKS_PER_RELEASE },
  { name: "cover", maxCount: 1 },
]);

// Marketplace listing photos: up to 5 images per listing.
const listingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const listingsDir = path.join(UPLOADS_DIR, req.userId, "listings");
    fs.mkdirSync(listingsDir, { recursive: true });
    cb(null, listingsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

export const MAX_LISTING_PHOTOS = 5;
export const MAX_LISTING_AUDIO = 3;

// Optional preview audio alongside a listing's photos — e.g. a beat for
// sale, or a demo of how an instrument/mix sounds — so a buyer can hear it
// before deciding. MP3 only, same as release tracks.
export const uploadListingMedia = multer({
  storage: listingStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB per file (audio needs more headroom than photos)
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "photos" && file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }
    if (file.fieldname === "audio" && file.mimetype === "audio/mpeg") {
      return cb(null, true);
    }
    cb(rejectedFileType("Photos must be images and audio must be MP3 files"));
  },
}).fields([
  { name: "photos", maxCount: MAX_LISTING_PHOTOS },
  { name: "audio", maxCount: MAX_LISTING_AUDIO },
]);
