import { Router } from "express";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rankReleasesByTaste } from "../ai/musicFeed.js";

const router = Router();
router.use(requireAuth);

function releaseGenres(release) {
  return [...new Set(release.tracks.flatMap((t) => t.genres || []))];
}

function toFeedItem({ release, owner }, isFriend) {
  return {
    releaseId: release._id,
    title: release.title,
    coverUrl: release.coverUrl,
    createdAt: release.createdAt,
    trackCount: release.tracks.length,
    genres: releaseGenres(release),
    artist: owner.toPublicProfile(),
    isFriend,
  };
}

// GET /music/feed — new releases from Friends first, then everyone else
// ranked by taste (AI-assisted genre affinity, brief: "agentic").
router.get(
  "/feed",
  asyncHandler(async (req, res) => {
    const me = await User.findById(req.userId);
    if (!me) return res.status(404).json({ error: "User not found" });

    const jamConversations = await Conversation.find({
      participants: me._id,
      isJam: true,
    });
    const friendIds = new Set(
      jamConversations
        .flatMap((c) => c.participants.map((p) => p.toString()))
        .filter((id) => id !== req.userId)
    );

    const artists = await User.find({
      _id: { $ne: me._id },
      "releases.0": { $exists: true },
    });

    const allEntries = artists
      .flatMap((owner) => owner.releases.map((release) => ({ release, owner })))
      .sort((a, b) => b.release.createdAt - a.release.createdAt);

    const friendEntries = allEntries.filter((e) => friendIds.has(e.owner._id.toString()));
    const otherEntries = allEntries.filter((e) => !friendIds.has(e.owner._id.toString()));

    const rankedOthers = await rankReleasesByTaste(me.genres, otherEntries);

    res.json({
      friendReleases: friendEntries.map((e) => toFeedItem(e, true)),
      forYouReleases: rankedOthers.map((e) => toFeedItem(e, false)),
    });
  })
);

export default router;
