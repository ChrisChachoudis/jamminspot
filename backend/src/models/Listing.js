import mongoose from "mongoose";

// Broad enough to cover what musicians actually sell — physical gear,
// digital goods (beats, presets), services (lessons, mixing), and merch —
// without over-splitting into narrow subcategories.
export const LISTING_CATEGORIES = ["instruments", "gear", "digital", "services", "merch", "other"];

const listingSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, enum: LISTING_CATEGORIES, required: true },
    photos: [{ url: String }],
  },
  { timestamps: true }
);

export default mongoose.model("Listing", listingSchema);
