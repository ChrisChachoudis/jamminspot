import { Router } from "express";
import path from "node:path";
import User from "../models/User.js";
import Listing from "../models/Listing.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Report, { REPORT_REASONS } from "../models/Report.js";
import bcrypt from "bcryptjs";
import { TERMS_VERSION } from "../config/legal.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadMedia, uploadRelease, mediaTypeFromMime } from "../middleware/upload.js";
import { storeUploadedFile, deleteStoredFile } from "../utils/fileStore.js";
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
    res.json({
      user: user.toPublicProfile(),
      onboardingComplete: user.onboardingComplete,
      termsAccepted: user.termsVersion === TERMS_VERSION,
      termsVersion: TERMS_VERSION,
    });
  })
);

// POST /users/me/accept-terms — existing users (or everyone, after the Terms
// change) confirm the current Terms/Privacy Policy and that they are 18+.
router.post(
  "/me/accept-terms",
  asyncHandler(async (req, res) => {
    if (req.body.acceptedTerms !== true || req.body.confirmedAge !== true) {
      return res.status(400).json({ error: "You must accept the Terms and confirm you are 18 or older" });
    }
    await User.updateOne(
      { _id: req.userId },
      { termsVersion: TERMS_VERSION, termsAcceptedAt: new Date() }
    );
    res.json({ ok: true });
  })
);

// GET /users/me/export — everything we hold about the account, as JSON
// (data portability). The password hash is never included.
router.get(
  "/me/export",
  asyncHandler(async (req, res) => {
    const [user, listings, conversations] = await Promise.all([
      User.findById(req.userId).lean(),
      Listing.find({ seller: req.userId }).lean(),
      Conversation.find({ participants: req.userId }).lean(),
    ]);
    if (!user) return res.status(404).json({ error: "User not found" });
    delete user.passwordHash;

    const messages = await Message.find({
      conversation: { $in: conversations.map((c) => c._id) },
    })
      .sort({ createdAt: 1 })
      .lean();

    res.setHeader("Content-Disposition", 'attachment; filename="jamminspot-data.json"');
    res.json({ exportedAt: new Date().toISOString(), account: user, listings, conversations, messages });
  })
);

// DELETE /users/me { password } — permanently deletes the account, its
// uploaded files, listings, conversations and traces in other users' data.
router.delete(
  "/me",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const password = req.body?.password;
    if (typeof password !== "string" || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    const listings = await Listing.find({ seller: user._id });
    const urls = [
      ...user.media.map((m) => m.url),
      ...user.releases.flatMap((r) => [r.coverUrl, ...r.tracks.map((t) => t.audioUrl)]),
      ...listings.flatMap((l) => [...l.photos.map((p) => p.url), ...l.audio.map((a) => a.url)]),
    ];
    for (const url of urls) await deleteStoredFile(url);

    const conversations = await Conversation.find({ participants: user._id }).select("_id");
    await Message.deleteMany({ conversation: { $in: conversations.map((c) => c._id) } });
    await Conversation.deleteMany({ participants: user._id });
    await Listing.deleteMany({ seller: user._id });
    await Report.deleteMany({ reporter: user._id });
    await User.updateMany(
      {},
      { $pull: { swipes: { user: user._id }, blockedUsers: user._id } }
    );
    // Nested array update only works on documents that have releases.
    await User.updateMany(
      { "releases.tracks.likes": user._id },
      { $pull: { "releases.$[].tracks.$[].likes": user._id } }
    );
    await User.deleteOne({ _id: user._id });

    res.json({ ok: true });
  })
);

// GET /users/me/blocked — the people this user has blocked.
router.get(
  "/me/blocked",
  asyncHandler(async (req, res) => {
    const me = await User.findById(req.userId).populate("blockedUsers");
    res.json({ blocked: (me?.blockedUsers || []).map((u) => u.toPublicProfile()) });
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
      url: await storeUploadedFile(req.file),
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

    await deleteStoredFile(item.url);

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

export function titleFromFilename(originalname) {
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

    const coverUrl = await storeUploadedFile(coverFile);
    const audioUrls = [];
    for (const file of audioFiles) audioUrls.push(await storeUploadedFile(file));

    user.releases.push({
      title: title.trim(),
      coverUrl,
      tracks: audioFiles.map((file, i) => ({
        title: titleFromFilename(file.originalname),
        audioUrl: audioUrls[i],
        genres: trackGenres[i] || [],
      })),
    });
    await user.save();

    res.status(201).json({ releases: user.releases });
  })
);

// PATCH /users/me/releases/:releaseId { title?, tracks?: [{ trackId, title?, genres? }] }
// Edit a release's name and/or a track's name/genres — audio and cover
// files themselves aren't replaceable, only their metadata.
router.patch(
  "/me/releases/:releaseId",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const release = user.releases.id(req.params.releaseId);
    if (!release) return res.status(404).json({ error: "Release not found" });

    const { title, tracks } = req.body;

    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ error: "title is required" });
      release.title = title.trim();
    }

    if (tracks !== undefined) {
      if (!Array.isArray(tracks)) {
        return res.status(400).json({ error: "tracks must be an array" });
      }
      for (const t of tracks) {
        const track = release.tracks.id(t.trackId);
        if (!track) return res.status(400).json({ error: `Unknown track: ${t.trackId}` });
        if (t.title !== undefined) {
          if (!t.title.trim()) return res.status(400).json({ error: "track title is required" });
          track.title = t.title.trim();
        }
        if (t.genres !== undefined) {
          if (!Array.isArray(t.genres) || t.genres.some((g) => !GENRES.includes(g))) {
            return res.status(400).json({ error: "track genres contain an invalid value" });
          }
          track.genres = t.genres;
        }
      }
    }

    await user.save();
    res.json({ releases: user.releases });
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
    for (const url of urls) await deleteStoredFile(url);

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

// POST /users/:id/report { reason, details } — flag a profile for review.
router.post(
  "/:id/report",
  asyncHandler(async (req, res) => {
    const { reason, details } = req.body;
    if (!REPORT_REASONS.includes(reason)) {
      return res.status(400).json({ error: `reason must be one of: ${REPORT_REASONS.join(", ")}` });
    }
    if (req.params.id === req.userId) {
      return res.status(400).json({ error: "You can't report yourself" });
    }
    const target = await User.findById(req.params.id).select("_id");
    if (!target) return res.status(404).json({ error: "User not found" });

    await Report.create({
      reporter: req.userId,
      reported: target._id,
      reason,
      details: typeof details === "string" ? details.slice(0, 1000) : "",
    });
    res.status(201).json({ ok: true });
  })
);

// POST /users/:id/block — hide each other everywhere (Discover, Jams, chat).
router.post(
  "/:id/block",
  asyncHandler(async (req, res) => {
    if (req.params.id === req.userId) {
      return res.status(400).json({ error: "You can't block yourself" });
    }
    const target = await User.findById(req.params.id).select("_id");
    if (!target) return res.status(404).json({ error: "User not found" });
    await User.updateOne({ _id: req.userId }, { $addToSet: { blockedUsers: target._id } });
    res.json({ blocked: true });
  })
);

// DELETE /users/:id/block — unblock.
router.delete(
  "/:id/block",
  asyncHandler(async (req, res) => {
    await User.updateOne({ _id: req.userId }, { $pull: { blockedUsers: req.params.id } });
    res.json({ blocked: false });
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
