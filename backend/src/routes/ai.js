import { Router } from "express";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { buildBio } from "../ai/profileBuilder.js";
import { suggestIcebreaker } from "../ai/icebreaker.js";

const router = Router();
router.use(requireAuth);

// POST /ai/bio { freeText } — AI Profile Builder (brief #39).
router.post("/bio", async (req, res) => {
  const { freeText } = req.body;
  if (!freeText?.trim()) {
    return res.status(400).json({ error: "freeText is required" });
  }

  try {
    const bio = await buildBio(freeText);
    res.json({ bio });
  } catch (err) {
    console.error("[ai/bio]", err);
    res.status(502).json({ error: "AI bio generation failed" });
  }
});

// POST /ai/icebreaker { targetUserId } — AI Icebreaker (brief #40).
router.post("/icebreaker", async (req, res) => {
  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({ error: "targetUserId is required" });

  const [me, target] = await Promise.all([
    User.findById(req.userId),
    User.findById(targetUserId),
  ]);
  if (!me || !target) return res.status(404).json({ error: "User not found" });

  try {
    const message = await suggestIcebreaker(me.toPublicProfile(), target.toPublicProfile());
    res.json({ message });
  } catch (err) {
    console.error("[ai/icebreaker]", err);
    res.status(502).json({ error: "AI icebreaker generation failed" });
  }
});

export default router;
