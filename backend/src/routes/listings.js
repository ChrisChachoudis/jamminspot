import { Router } from "express";
import Listing, { LISTING_CATEGORIES } from "../models/Listing.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadListingMedia } from "../middleware/upload.js";
import { titleFromFilename } from "./users.js";
import { distanceKm } from "../utils/matching.js";

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

// Same as serializeListing, plus the populated seller — for anywhere a
// buyer (not just the owner) sees a listing: the Market grid and the
// single-listing detail page.
function serializeListingWithSeller(listing, extra = {}) {
  return {
    ...serializeListing(listing),
    ...extra,
    seller: {
      id: listing.seller._id,
      name: listing.seller.name,
      city: listing.seller.location?.city ?? null,
      media: listing.seller.media,
      profilePhotoId: listing.seller.profilePhotoId,
    },
  };
}

// GET /listings — browse the market (everyone else's listings).
// Filters: category, minPrice, maxPrice, and an optional area filter
// (latitude/longitude/maxDistanceKm) — same city+radius pattern as Near Me,
// applied to the SELLER's location rather than the listing itself (a
// listing has no location of its own).
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { category, minPrice, maxPrice, latitude, longitude, maxDistanceKm } = req.query;

    const query = { seller: { $ne: req.userId } };
    if (category) {
      if (!LISTING_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `category must be one of: ${LISTING_CATEGORIES.join(", ")}` });
      }
      query.category = category;
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // With no filter picked yet, show a quick "what's new" glance (latest
    // 10) instead of the whole market; once any filter is applied, the
    // results are already narrowed down so the full match set is more useful.
    const hasAnyFilter = Boolean(category || minPrice || maxPrice || latitude || longitude || maxDistanceKm);

    let listings = await Listing.find(query)
      .populate("seller", "name media profilePhotoId location")
      .sort({ createdAt: -1 })
      .limit(hasAnyFilter ? 200 : 10);

    // Drop listings whose seller account no longer exists.
    listings = listings.filter((l) => l.seller);

    const lat = Number(latitude);
    const lon = Number(longitude);
    const radiusKm = Number(maxDistanceKm);
    const hasAreaFilter = Number.isFinite(lat) && Number.isFinite(lon) && Number.isFinite(radiusKm) && radiusKm > 0;

    let results = listings.map((listing) => {
      const sellerCoords = listing.seller.location?.coordinates;
      const distance = hasAreaFilter && sellerCoords ? distanceKm([lon, lat], sellerCoords) : null;
      return serializeListingWithSeller(listing, {
        distanceKm: distance === null ? null : Math.round(distance),
      });
    });

    if (hasAreaFilter) {
      results = results
        .filter((r) => r.distanceKm !== null && r.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }

    res.json({ listings: results });
  })
);

// GET /listings/mine — the current user's own listings, for managing them
// from the Me page.
router.get(
  "/mine",
  asyncHandler(async (req, res) => {
    const listings = await Listing.find({ seller: req.userId }).sort({ createdAt: -1 });
    res.json({ listings: listings.map(serializeListing) });
  })
);

// GET /listings/user/:id — a specific person's listings, viewable by anyone
// signed in. Powers the "Seller" badge on Profile/Discover/Near Me cards
// (a non-empty result means they have something for sale) and the seller
// detail page it links to.
router.get(
  "/user/:id",
  asyncHandler(async (req, res) => {
    const listings = await Listing.find({ seller: req.params.id }).sort({ createdAt: -1 });
    res.json({ listings: listings.map(serializeListing) });
  })
);

// GET /listings/:id — a single listing's full detail (photos, description,
// audio, seller), for the Market's product detail page. Must stay after
// the literal routes above (/, /mine, /user/:id) so it doesn't swallow them.
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const listing = await Listing.findById(req.params.id).populate(
      "seller",
      "name media profilePhotoId location"
    );
    if (!listing || !listing.seller) {
      return res.status(404).json({ error: "Listing not found" });
    }
    res.json({ listing: serializeListingWithSeller(listing) });
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

// PATCH /listings/:id — edit title/description/price/category of your own
// listing (photos/audio stay as originally uploaded; only the seller can edit).
router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const listing = await Listing.findOne({ _id: req.params.id, seller: req.userId });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    const { title, description, price, category } = req.body;

    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ error: "title is required" });
      listing.title = title.trim();
    }
    if (description !== undefined) listing.description = description.trim();
    if (price !== undefined) {
      const priceNum = Number(price);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        return res.status(400).json({ error: "price must be a non-negative number" });
      }
      listing.price = priceNum;
    }
    if (category !== undefined) {
      if (!LISTING_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `category must be one of: ${LISTING_CATEGORIES.join(", ")}` });
      }
      listing.category = category;
    }

    await listing.save();
    res.json({ listing: serializeListing(listing) });
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
