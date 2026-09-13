import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import User from "../src/models/User.js";
import Listing from "../src/models/Listing.js";
import { UPLOADS_DIR } from "../src/middleware/upload.js";

// Two listings each for the 10 musicians already created by seed.js — they
// already span a good mix of nearby (Athens) and far-apart Greek cities
// (Crete, Rhodes, Thessaloniki, ...), which is exactly what's needed to
// exercise the Market's category/price/area filters locally.
const LISTINGS_BY_EMAIL = {
  "nikos.athens@jamminspot.dev": [
    { title: "Fender Stratocaster 2018", price: 450, category: "instruments" },
    { title: "Band tour t-shirt", price: 15, category: "merch" },
  ],
  "eleni.thessaloniki@jamminspot.dev": [
    { title: "Vocal coaching session", price: 30, category: "services" },
    { title: "Warm-up vocal FX preset pack", price: 10, category: "digital" },
  ],
  "dimitris.patra@jamminspot.dev": [
    { title: "Trap Beat Pack Vol. 1", price: 25, category: "digital" },
    { title: "Pioneer DDJ-400 Controller", price: 300, category: "gear" },
  ],
  "sofia.heraklion@jamminspot.dev": [
    { title: "Pearl Export 5-piece drum kit", price: 700, category: "instruments" },
    { title: "Drum lessons for beginners", price: 18, category: "services" },
  ],
  "yannis.larissa@jamminspot.dev": [
    { title: "Ibanez SR300 Bass Guitar", price: 320, category: "instruments" },
    { title: "Session bassist available", price: 35, category: "services" },
  ],
  "katerina.volos@jamminspot.dev": [
    { title: "Korg Minilogue Synth", price: 280, category: "gear" },
    { title: "Ambient Serum preset pack", price: 12, category: "digital" },
  ],
  "petros.ioannina@jamminspot.dev": [
    { title: "Handmade acoustic guitar", price: 500, category: "instruments" },
    { title: "Violin session recording", price: 40, category: "services" },
  ],
  "maria.chania@jamminspot.dev": [
    { title: "Mixing & mastering - 1 track", price: 50, category: "services" },
    { title: "Focusrite Scarlett 2i2", price: 120, category: "gear" },
  ],
  "alexandros.kavala@jamminspot.dev": [
    { title: "Exclusive trap beat", price: 60, category: "digital" },
    { title: "AKG P120 microphone", price: 90, category: "gear" },
  ],
  "christina.rhodes@jamminspot.dev": [
    { title: "Yamaha digital piano", price: 600, category: "instruments" },
    { title: "Live wedding singer booking", price: 150, category: "services" },
  ],
};

const PLACEHOLDER_URL = "/uploads/market-seed/placeholder.png";

function ensurePlaceholderPhoto() {
  const dir = path.join(UPLOADS_DIR, "market-seed");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "placeholder.png");
  if (!fs.existsSync(file)) {
    const base64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    fs.writeFileSync(file, Buffer.from(base64, "base64"));
  }
}

async function seedMarket() {
  await connectDB();
  ensurePlaceholderPhoto();

  const emails = Object.keys(LISTINGS_BY_EMAIL);
  const users = await User.find({ email: { $in: emails } });
  const userByEmail = new Map(users.map((u) => [u.email, u]));

  const missing = emails.filter((e) => !userByEmail.has(e));
  if (missing.length) {
    console.error("[seedMarket] missing users, run scripts/seed.js first:", missing);
    process.exit(1);
  }

  // Idempotent: clear out any listings from these sellers before re-inserting.
  const sellerIds = users.map((u) => u._id);
  await Listing.deleteMany({ seller: { $in: sellerIds } });

  let count = 0;
  for (const [email, listings] of Object.entries(LISTINGS_BY_EMAIL)) {
    const user = userByEmail.get(email);
    for (const l of listings) {
      await Listing.create({
        seller: user._id,
        title: l.title,
        description: `${l.title} — posted by ${user.name} in ${user.location?.city || "Greece"}.`,
        price: l.price,
        category: l.category,
        photos: [{ url: PLACEHOLDER_URL }],
        audio: [],
      });
      count++;
    }
    console.log(`[seedMarket] ${listings.length} listings for ${user.name} (${user.location?.city})`);
  }

  console.log(`[seedMarket] done — ${count} listings created`);
  await mongoose.disconnect();
}

seedMarket().catch((err) => {
  console.error(err);
  process.exit(1);
});
