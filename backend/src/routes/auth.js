import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../utils/token.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const COMMON_PASSWORDS = new Set([
  "12345678", "123456789", "1234567890", "password", "password1", "password123",
  "qwertyui", "qwerty123", "11111111", "iloveyou", "abc12345", "00000000",
]);

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    // Names are rendered as plain text by React, but strip tags so they never
    // leak into emails or other non-React surfaces later.
    const name = typeof req.body.name === "string" ? req.body.name.replace(/[<>]/g, "").trim().slice(0, 60) : undefined;

    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }
    if (!EMAIL_RE.test(email.trim()) || email.length > 254) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "password must be at least 8 characters" });
    }
    if (password.length > 72 || COMMON_PASSWORDS.has(password.toLowerCase())) {
      return res.status(400).json({ error: "Please choose a stronger password (max 72 characters)" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, name });

    const token = signToken(user._id);
    res.status(201).json({ token, user: user.toPublicProfile() });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user._id);
    res.json({ token, user: user.toPublicProfile() });
  })
);

export default router;
