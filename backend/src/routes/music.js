import { Router } from "express";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rankTracksByTaste } from "../ai/musicFeed.js";
import { rankForYou } from "../utils/musicRanking.js";

const router = Router();
router.use(requireAuth);

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function reasonLabel(reason) {
  if (!reason) return null;
  if (reason === "friend") return "Because a friend of yours liked this";
  if (reason === "similar_taste") return "Because people with similar taste liked this";
  if (reason === "wildcard") return "🔀 Something different for you";
  if (reason.type === "genre") return `Because you're into ${reason.genre.replace(/_/g, " ")}`;
  return null;
}

function toTrackItem({ track, release, owner, reason }, viewerId) {
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
    reason: reasonLabel(reason),
  };
}

// GET /music/feed
// - friendTracks: new from Friends, newest first
// - newThisWeek: everyone's uploads from the last 7 days, newest first
//   (Spotify "Release Radar" style — a reason to check back regularly)
// - forYouTracks: everyone else, blending AI genre relevance with
//   collaborative filtering, friend social proof, and recency-weighted
//   popularity — see utils/musicRanking.js for the full algorithm.
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

    const now = Date.now();
    const newThisWeek = allTracks
      .filter((t) => now - new Date(t.release.createdAt).getTime() <= ONE_WEEK_MS)
      .sort((a, b) => b.release.createdAt - a.release.createdAt)
      .slice(0, 10);

    const otherTracks = allTracks.filter((t) => !friendIds.has(t.owner._id.toString()));

    const relevanceRanked = await rankTracksByTaste(me.genres, otherTracks, req.userId);
    const relevanceRank = new Map(relevanceRanked.map((t, i) => [t.track._id.toString(), i]));

    const forYouTracks = rankForYou({
      candidates: otherTracks,
      relevanceRank,
      viewerId: req.userId,
      viewerGenres: me.genres,
      friendIds,
    });

    res.json({
      friendTracks: friendTracks.map((t) => toTrackItem(t, req.userId)),
      newThisWeek: newThisWeek.map((t) => toTrackItem(t, req.userId)),
      forYouTracks: forYouTracks.map((t) => toTrackItem(t, req.userId)),
    });
  })
);

export default router;
