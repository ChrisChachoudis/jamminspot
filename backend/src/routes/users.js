import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadMedia, mediaTypeFromMime, UPLOADS_DIR } from "../middleware/upload.js";
import { computeCompatibility } from "../utils/matching.js";
import {
  SPECIALTIES,
  INSTRUMENTS,
  VOCAL_SKILLS,
  GOALS,
  GENRES,
} from "../config/constants.js";

const router = Router();
router.use(requireAuth);

router.get(
  "/me",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: user.toPublicProfile(), onboardingComplete: user.onboardingComplete });
  })
);

// GET /users/me/admirers — pending Jam requests: musicians who Jammed you
// that you haven't responded to yet (accept = Jam them back, reject = Skip
// them — both remove the request from this list since either becomes an
// entry in your own swipes).
router.get(
  "/me/admirers",
  asyncHandler(async (req, res) => {
    const me = await User.findById(req.userId);
    if (!me) return res.status(404).json({ error: "User not found" });

    const respondedIds = new Set(me.swipes.map((s) => s.user.toString()));

    const admirerDocs = await User.find({
      swipes: { $elemMatch: { user: me._id, action: "jam" } },
      _id: { $nin: Array.from(respondedIds) },
    });

    const admirers = admirerDocs.map((u) => ({
      profile: u.toPublicProfile(),
      compatibility: computeCompatibility(me, u),
    }));

    res.json({ admirers });
  })
);

function validateEnumArray(value, allowed, field) {
  if (value === undefined) return null;
  if (!Array.isArray(value) || value.some((v) => !allowed.includes(v))) {
    return `${field} must be an array containing only: ${allowed.join(", ")}`;
  }
  return null;
}

// Onboarding step: instruments/specialty -> goals -> genres -> gallery
// (brief section 7-10). Accepts a partial payload so the client can save
// progress after each step.
router.patch(
  "/me/onboarding",
  asyncHandler(async (req, res) => {
    const { specialties, instruments, vocalSkills, goals, genres, city, country, name, bio } =
      req.body;

    for (const [value, allowed, field] of [
      [specialties, SPECIALTIES, "specialties"],
      [instruments, INSTRUMENTS, "instruments"],
      [vocalSkills, VOCAL_SKILLS, "vocalSkills"],
      [goals, GOALS, "goals"],
      [genres, GENRES, "genres"],
    ]) {
      const err = validateEnumArray(value, allowed, field);
      if (err) return res.status(400).json({ error: err });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (specialties) user.specialties = specialties;
    if (instruments) user.instruments = instruments;
    if (vocalSkills) user.vocalSkills = vocalSkills;
    if (goals) user.goals = goals;
    if (genres) user.genres = genres;
    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (city || country) {
      user.location = { ...(user.location?.toObject?.() ?? user.location), city, country };
    }

    const hasCore =
      user.specialties?.length && user.goals?.length && user.genres?.length;
    user.onboardingComplete = Boolean(hasCore);

    await user.save();
    res.json({ user: user.toPublicProfile(), onboardingComplete: user.onboardingComplete });
  })
);

router.patch(
  "/me/location",
  asyncHandler(async (req, res) => {
    const { longitude, latitude, city, country } = req.body;
    if (typeof longitude !== "number" || typeof latitude !== "number") {
      return res.status(400).json({ error: "longitude and latitude must be numbers" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.location = {
      type: "Point",
      coordinates: [longitude, latitude],
      city: city ?? user.location?.city,
      country: country ?? user.location?.country,
    };
    await user.save();
    res.json({ user: user.toPublicProfile() });
  })
);

// POST /users/me/media — multipart upload, field name "file" (brief #9, gallery step).
router.post(
  "/me/media",
  uploadMedia.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "file is required" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const item = {
      type: mediaTypeFromMime(req.file.mimetype),
      url: `/uploads/${req.userId}/${req.file.filename}`,
    };
    user.media.push(item);
    await user.save();

    res.status(201).json({ media: user.media });
  })
);

router.delete(
  "/me/media/:mediaId",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const item = user.media.id(req.params.mediaId);
    if (!item) return res.status(404).json({ error: "Media item not found" });

    const filePath = path.join(UPLOADS_DIR, req.userId, path.basename(item.url));
    fs.unlink(filePath, () => {});

    if (user.profilePhotoId?.toString() === req.params.mediaId) {
      user.profilePhotoId = null;
    }

    item.deleteOne();
    await user.save();

    res.json({ media: user.media, profilePhotoId: user.profilePhotoId });
  })
);

// PATCH /users/me/profile-photo { mediaId } — pick which uploaded photo is
// shown as your profile picture (null clears it, falling back to the first
// image in `media`).
router.patch(
  "/me/profile-photo",
  asyncHandler(async (req, res) => {
    const { mediaId } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (mediaId === null) {
      user.profilePhotoId = null;
    } else {
      const item = user.media.id(mediaId);
      if (!item || item.type !== "image") {
        return res.status(400).json({ error: "mediaId must reference one of your uploaded photos" });
      }
      user.profilePhotoId = item._id;
    }

    await user.save();
    res.json({ user: user.toPublicProfile() });
  })
);

// Kept last: "/:id" would otherwise swallow the literal routes above.
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: user.toPublicProfile() });
  })
);

export default router;
