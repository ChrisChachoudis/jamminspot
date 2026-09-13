import { Router } from "express";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rankTracksByTaste } from "../ai/musicFeed.js";

const router = Router();
router.use(requireAuth);

function toTrackItem({ track, release, owner }, viewerId) {
  return {
    trackId: track._id,
    title: track.title,
    audioUrl: track.audioUrl,
    genres: track.genres || [],
    likeCount: track.likes.length,
    likedByMe: track.likes.some((id) => id.toString() === viewerId),
    releaseId: release._id,
    releaseTitle: release.title,
    coverUrl: release.coverUrl,
    createdAt: release.createdAt,
    artist: owner.toPublicProfile(),
  };
}

// GET /music/feed — new tracks from Friends first (newest first), then
// everyone else: AI-ranked by taste to pick the relevant pool, then
// resorted so the most-liked tracks surface to the top within it
// (brief: "like the YouTube algorithm" — relevance picks the pool,
// engagement decides the order).
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

    const allTracks = artists.flatMap((owner) =>
      owner.releases.flatMap((release) =>
        release.tracks.map((track) => ({ track, release, owner }))
      )
    );

    const friendTracks = allTracks
      .filter((t) => friendIds.has(t.owner._id.toString()))
      .sort((a, b) => b.release.createdAt - a.release.createdAt);

    const otherTracks = allTracks.filter((t) => !friendIds.has(t.owner._id.toString()));

    const relevanceRanked = await rankTracksByTaste(me.genres, otherTracks, req.userId);
    const relevanceRank = new Map(
      relevanceRanked.map((t, i) => [t.track._id.toString(), i])
    );

    // Likes decide the final order; relevance rank only breaks ties among
    // equally-liked tracks (e.g. everything currently at 0 likes).
    const forYouTracks = [...relevanceRanked].sort((a, b) => {
      const likeDiff = b.track.likes.length - a.track.likes.length;
      if (likeDiff !== 0) return likeDiff;
      return relevanceRank.get(a.track._id.toString()) - relevanceRank.get(b.track._id.toString());
    });

    res.json({
      friendTracks: friendTracks.map((t) => toTrackItem(t, req.userId)),
      forYouTracks: forYouTracks.map((t) => toTrackItem(t, req.userId)),
    });
  })
);

export default router;
