import { Router } from "express";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);

async function assertParticipant(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return { error: "Conversation not found", status: 404 };
  if (!conversation.participants.some((p) => p.toString() === userId)) {
    return { error: "Not a participant in this conversation", status: 403 };
  }
  return { conversation };
}

// GET /messages — conversation list (left pane, brief #21).
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const conversations = await Conversation.find({ participants: req.userId })
      .populate("participants")
      .sort({ "lastMessage.sentAt": -1, updatedAt: -1 });

    const list = conversations.map((c) => ({
      conversationId: c._id,
      isJam: c.isJam,
      lastMessage: c.lastMessage,
      musician: c.participants
        .find((p) => p._id.toString() !== req.userId)
        ?.toPublicProfile(),
    }));

    res.json({ conversations: list });
  })
);

// POST /messages/direct { targetUserId, text } — start a new conversation.
// Registered before "/:conversationId" — otherwise Express would match
// "direct" as a conversationId and never reach this handler.
// Messaging someone you haven't Jammed with yet (not a Friend) requires
// Premium; messaging an existing Friend is always free.
router.post(
  "/direct",
  asyncHandler(async (req, res) => {
    const { targetUserId, text } = req.body;
    if (!targetUserId || !text?.trim()) {
      return res.status(400).json({ error: "targetUserId and text are required" });
    }

    const [me, target] = await Promise.all([
      User.findById(req.userId),
      User.findById(targetUserId),
    ]);
    if (!me || !target) return res.status(404).json({ error: "User not found" });

    let conversation = await Conversation.findOne({
      participants: { $all: [req.userId, targetUserId] },
    });

    const isFriend = conversation?.isJam;
    if (!isFriend && !me.premium) {
      return res.status(403).json({
        error: "Only Premium members can message musicians they haven't Jammed with yet.",
      });
    }

    if (!conversation) {
      conversation = await Conversation.create({ participants: [req.userId, targetUserId] });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.userId,
      text: text.trim(),
    });

    conversation.lastMessage = { text: message.text, sender: req.userId, sentAt: message.createdAt };
    await conversation.save();

    res.status(201).json({ conversationId: conversation._id, message });
  })
);

// GET /messages/:conversationId — thread for the center pane.
router.get(
  "/:conversationId",
  asyncHandler(async (req, res) => {
    const { error, status } = await assertParticipant(req.params.conversationId, req.userId);
    if (error) return res.status(status).json({ error });

    const messages = await Message.find({ conversation: req.params.conversationId }).sort({
      createdAt: 1,
    });

    await Message.updateMany(
      { conversation: req.params.conversationId, sender: { $ne: req.userId }, readAt: null },
      { $set: { readAt: new Date() } }
    );

    res.json({ messages });
  })
);

// POST /messages/:conversationId { text } — reply within an existing conversation.
router.post(
  "/:conversationId",
  asyncHandler(async (req, res) => {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "text is required" });

    const { error, status, conversation } = await assertParticipant(
      req.params.conversationId,
      req.userId
    );
    if (error) return res.status(status).json({ error });

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.userId,
      text: text.trim(),
    });

    conversation.lastMessage = { text: message.text, sender: req.userId, sentAt: message.createdAt };
    await conversation.save();

    res.status(201).json({ message });
  })
);

export default router;
