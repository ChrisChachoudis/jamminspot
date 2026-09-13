import { Router } from "express";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import { requireAuth } from "../middleware/auth.js";
import { computeCompatibility, distanceKm } from "../utils/matching.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);

// GET /discover?specialty=&instrument=&genre=&goal=&maxDistanceKm=&limit=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const me = await User.findById(req.userId);
    if (!me) return res.status(404).json({ error: "User not found" });

    const { specialty, instrument, genre, goal, maxDistanceKm, limit = 20 } = req.query;

    const seenIds = new Set(me.swipes.map((s) => s.user.toString()));
    seenIds.add(me._id.toString());

    const query = { _id: { $nin: Array.from(seenIds) } };
    if (specialty) query.specialties = specialty;
    if (instrument) query.instruments = instrument;
    if (genre) query.genres = genre;
    if (goal) query.goals = goal;

    if (maxDistanceKm && me.location?.coordinates) {
      query.location = {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: me.location.coordinates },
          $maxDistance: Number(maxDistanceKm) * 1000,
        },
      };
    }

    const candidates = await User.find(query).limit(Math.min(Number(limit), 50));

    const results = candidates
      .map((candidate) => {
        const compatibility = computeCompatibility(me, candidate);
        return { profile: candidate.toPublicProfile(), compatibility };
      })
      .sort((a, b) => b.compatibility.score - a.compatibility.score);

    res.json({ results });
  })
);

// GET /discover/near-me?latitude=&longitude=&maxDistanceKm=&limit=
// Facebook-Marketplace-style search: unlike GET /, the center point is
// whatever place the user picked on the Near Me page, not their own saved
// location — so this takes latitude/longitude directly instead of reading
// me.location.
router.get(
  "/near-me",
  asyncHandler(async (req, res) => {
    const { latitude, longitude, maxDistanceKm, limit = 40 } = req.query;
    const lat = Number(latitude);
    const lon = Number(longitude);
    const radiusKm = Number(maxDistanceKm);

    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(radiusKm) || radiusKm <= 0) {
      return res.status(400).json({ error: "latitude, longitude and a positive maxDistanceKm are required" });
    }

    const candidates = await User.find({
      _id: { $ne: req.userId },
      location: {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [lon, lat] },
          $maxDistance: radiusKm * 1000,
        },
      },
    }).limit(Math.min(Number(limit) || 40, 100));

    const results = candidates
      .map((candidate) => ({
        profile: candidate.toPublicProfile(),
        distanceKm: Math.round(distanceKm([lon, lat], candidate.location.coordinates)),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({ results });
  })
);

// POST /discover/swipe { targetUserId, action: "like" | "skip" | "jam" }
router.post(
  "/swipe",
  asyncHandler(async (req, res) => {
    const { targetUserId, action } = req.body;
    if (!targetUserId || !["like", "skip", "jam"].includes(action)) {
      return res.status(400).json({ error: "targetUserId and a valid action are required" });
    }
    if (targetUserId === req.userId) {
      return res.status(400).json({ error: "Cannot swipe on your own profile" });
    }

    const [me, target] = await Promise.all([
      User.findById(req.userId),
      User.findById(targetUserId),
    ]);
    if (!me || !target) return res.status(404).json({ error: "User not found" });

    me.swipes.push({ user: target._id, action });
    await me.save();

    let jamCreated = false;
    let conversation = null;

    if (action === "like" || action === "jam") {
      const reciprocal = target.swipes.find(
        (s) =>
          s.user.toString() === me._id.toString() && (s.action === "like" || s.action === "jam")
      );

      if (reciprocal) {
        conversation = await Conversation.findOne({
          participants: { $all: [me._id, target._id] },
        });
        if (!conversation) {
          conversation = await Conversation.create({
            participants: [me._id, target._id],
          });
        }
        if (!conversation.isJam) {
          conversation.isJam = true;
          conversation.jamAt = new Date();
          await conversation.save();
        }
        jamCreated = true;
      }
    }

    res.json({ jamCreated, conversationId: conversation?._id ?? null });
  })
);

// POST /discover/rewind — undo the last swipe (premium feature, brief #12/#26).
router.post(
  "/rewind",
  asyncHandler(async (req, res) => {
    const me = await User.findById(req.userId);
    if (!me) return res.status(404).json({ error: "User not found" });
    if (!me.premium) {
      return res.status(403).json({ error: "Rewind is a Premium feature" });
    }
    if (!me.swipes.length) {
      return res.status(400).json({ error: "No swipe to rewind" });
    }

    const removed = me.swipes.pop();
    await me.save();
    res.json({ rewoundUserId: removed.user });
  })
);

export default router;
