import { Router } from "express";
import Listing, { LISTING_CATEGORIES } from "../models/Listing.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadListingMedia } from "../middleware/upload.js";
import { titleFromFilename } from "./users.js";

const router = Router();
router.use(requireAuth);

function serializeListing(listing) {
  return {
    id: listing._id,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    category: listing.category,
    photos: listing.photos.map((p) => p.url),
    audio: listing.audio.map((a) => ({ url: a.url, title: a.title })),
    createdAt: listing.createdAt,
  };
}

// GET /listings/mine — the current user's own listings, for managing them
// from the Me page.
router.get(
  "/mine",
  asyncHandler(async (req, res) => {
    const listings = await Listing.find({ seller: req.userId }).sort({ createdAt: -1 });
    res.json({ listings: listings.map(serializeListing) });
  })
);

// POST /listings — multipart: title, description, price, category,
// photos[] (1-5 images, required), audio[] (0-3 MP3s, optional preview).
router.post(
  "/",
  uploadListingMedia,
  asyncHandler(async (req, res) => {
    const { title, description, price, category } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: "title is required" });
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return res.status(400).json({ error: "price must be a non-negative number" });
    }
    if (!LISTING_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${LISTING_CATEGORIES.join(", ")}` });
    }

    const photoFiles = req.files?.photos || [];
    const audioFiles = req.files?.audio || [];
    if (!photoFiles.length) {
      return res.status(400).json({ error: "At least one photo is required" });
    }

    const listing = await Listing.create({
      seller: req.userId,
      title: title.trim(),
      description: description?.trim() || "",
      price: priceNum,
      category,
      photos: photoFiles.map((f) => ({ url: `/uploads/${req.userId}/listings/${f.filename}` })),
      audio: audioFiles.map((f) => ({
        url: `/uploads/${req.userId}/listings/${f.filename}`,
        title: titleFromFilename(f.originalname),
      })),
    });

    res.status(201).json({ listing: serializeListing(listing) });
  })
);

// DELETE /listings/:id — only the seller can remove their own listing.
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const listing = await Listing.findOneAndDelete({ _id: req.params.id, seller: req.userId });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    const listings = await Listing.find({ seller: req.userId }).sort({ createdAt: -1 });
    res.json({ listings: listings.map(serializeListing) });
  })
);

export default router;
