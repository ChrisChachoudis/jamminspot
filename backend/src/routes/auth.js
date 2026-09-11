import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../utils/token.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "password must be at least 8 characters" });
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
