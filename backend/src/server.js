import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { UPLOADS_DIR } from "./middleware/upload.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import discoverRoutes from "./routes/discover.js";
import jamsRoutes from "./routes/jams.js";
import messagesRoutes from "./routes/messages.js";
import aiRoutes from "./routes/ai.js";
import musicRoutes from "./routes/music.js";
import listingsRoutes from "./routes/listings.js";

// Last-resort safety net: log instead of crashing the whole dev server if
// any promise rejection ever slips past asyncHandler/try-catch.
process.on("unhandledRejection", (err) => {
  console.error("[unhandledRejection]", err);
});

const app = express();

// CLIENT_ORIGIN accepts a comma-separated list so both the local dev
// frontend and the deployed one can be allowed at once.
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));
app.use("/uploads", express.static(UPLOADS_DIR));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/discover", discoverRoutes);
app.use("/api/jams", jamsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/music", musicRoutes);
app.use("/api/listings", listingsRoutes);

app.use((err, req, res, next) => {
  if (err.name === "CastError" || err.name === "ValidationError") {
    return res.status(400).json({ error: "Invalid request" });
  }
  if (err.name === "MulterError" || err.statusCode === 400) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(port, () => console.log(`[server] listening on :${port}`));
  })
  .catch((err) => {
    console.error("[db] connection failed", err);
    process.exit(1);
  });
