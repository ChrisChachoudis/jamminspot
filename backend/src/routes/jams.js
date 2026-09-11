import { Router } from "express";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { computeCompatibility } from "../utils/matching.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);

// GET /jams — board of mutual connections (brief #20).
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const me = await User.findById(req.userId);
    if (!me) return res.status(404).json({ error: "User not found" });

    const conversations = await Conversation.find({
      participants: req.userId,
      isJam: true,
    })
      .populate("participants")
      .sort({ "lastMessage.sentAt": -1, jamAt: -1 });

    const jams = conversations.map((conversation) => {
      const other = conversation.participants.find(
        (p) => p._id.toString() !== req.userId
      );
      const compatibility = other ? computeCompatibility(me, other) : null;

      return {
        conversationId: conversation._id,
        jamAt: conversation.jamAt,
        lastMessage: conversation.lastMessage,
        musician: other?.toPublicProfile() ?? null,
        compatibility,
      };
    });

    res.json({ jams });
  })
);

export default router;
