import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadMedia, uploadRelease, mediaTypeFromMime, UPLOADS_DIR } from "../middleware/upload.js";
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

    // Sort most-recent Jam request first, so someone who just Jammed you
    // shows up ahead of requests you've been sitting on for a while.
    const admirers = admirerDocs
      .map((u) => {
        const jamAt = u.swipes
          .filter((s) => s.user.toString() === me._id.toString() && s.action === "jam")
          .reduce((latest, s) => (s.createdAt > latest ? s.createdAt : latest), new Date(0));
        return {
          profile: u.toPublicProfile(),
          compatibility: computeCompatibility(me, u),
          jamAt,
        };
      })
      .sort((a, b) => b.jamAt - a.jamAt)
      .map(({ profile, compatibility }) => ({ profile, compatibility }));

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

function titleFromFilename(originalname) {
  // Multer/busboy decode multipart filenames as latin1 by default, which
  // mangles any non-ASCII (e.g. Greek) filename a browser sent as UTF-8 —
  // re-decode to undo that.
  const fixed = Buffer.from(originalname, "latin1").toString("utf8");
  return path.basename(fixed, path.extname(fixed));
}

// POST /users/me/releases — multipart upload: "cover" (single JPG) + "audio"
// (one or more MP3s, one release-level title covers a single track, EP or
// LP alike). Each track's title is taken from its filename.
router.post(
  "/me/releases",
  uploadRelease,
  asyncHandler(async (req, res) => {
    const { title } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "title is required" });

    const audioFiles = req.files?.audio || [];
    const coverFile = req.files?.cover?.[0];
    if (!audioFiles.length || !coverFile) {
      return res
        .status(400)
        .json({ error: "At least one MP3 file and a cover image are required" });
    }

    // trackGenres is a JSON-encoded array of genre arrays, one entry per
    // audio file in the same order (brief: pick a genre per track).
    let trackGenres = [];
    if (req.body.trackGenres) {
      try {
        trackGenres = JSON.parse(req.body.trackGenres);
      } catch {
        return res.status(400).json({ error: "trackGenres must be valid JSON" });
      }
      if (!Array.isArray(trackGenres) || trackGenres.length !== audioFiles.length) {
        return res
          .status(400)
          .json({ error: "trackGenres must have one entry per track" });
      }
      for (const genres of trackGenres) {
        if (!Array.isArray(genres) || genres.some((g) => !GENRES.includes(g))) {
          return res.status(400).json({ error: "trackGenres contains an invalid genre" });
        }
      }
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.releases.push({
      title: title.trim(),
      coverUrl: `/uploads/${req.userId}/releases/${coverFile.filename}`,
      tracks: audioFiles.map((file, i) => ({
        title: titleFromFilename(file.originalname),
        audioUrl: `/uploads/${req.userId}/releases/${file.filename}`,
        genres: trackGenres[i] || [],
      })),
    });
    await user.save();

    res.status(201).json({ releases: user.releases });
  })
);

router.delete(
  "/me/releases/:releaseId",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const release = user.releases.id(req.params.releaseId);
    if (!release) return res.status(404).json({ error: "Release not found" });

    const urls = [release.coverUrl, ...release.tracks.map((t) => t.audioUrl)];
    for (const url of urls) {
      const filePath = path.join(UPLOADS_DIR, req.userId, "releases", path.basename(url));
      fs.unlink(filePath, () => {});
    }

    release.deleteOne();
    await user.save();

    res.json({ releases: user.releases });
  })
);

function serializeRelease(release, viewerId) {
  return {
    _id: release._id,
    title: release.title,
    coverUrl: release.coverUrl,
    createdAt: release.createdAt,
    tracks: release.tracks.map((track) => ({
      _id: track._id,
      title: track.title,
      audioUrl: track.audioUrl,
      genres: track.genres,
      likeCount: track.likes.length,
      likedByMe: track.likes.some((id) => id.toString() === viewerId),
    })),
  };
}

// GET /users/:id/releases — public discography listing for an artist's profile.
router.get(
  "/:id/releases",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      name: user.name,
      releases: user.releases.map((r) => serializeRelease(r, req.userId)),
    });
  })
);

// POST /users/:id/releases/:releaseId/tracks/:trackId/like — toggle a like
// for the current user on someone else's track (brief: like a track).
router.post(
  "/:id/releases/:releaseId/tracks/:trackId/like",
  asyncHandler(async (req, res) => {
    const artist = await User.findById(req.params.id);
    if (!artist) return res.status(404).json({ error: "User not found" });

    const release = artist.releases.id(req.params.releaseId);
    const track = release?.tracks.id(req.params.trackId);
    if (!track) return res.status(404).json({ error: "Track not found" });

    const idx = track.likes.findIndex((id) => id.toString() === req.userId);
    let liked;
    if (idx === -1) {
      track.likes.push(req.userId);
      liked = true;
    } else {
      track.likes.splice(idx, 1);
      liked = false;
    }
    await artist.save();

    res.json({ liked, likeCount: track.likes.length });
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
