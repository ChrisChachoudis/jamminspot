import mongoose from "mongoose";
import {
  SPECIALTIES,
  INSTRUMENTS,
  VOCAL_SKILLS,
  GOALS,
  GENRES,
} from "../config/constants.js";

const mediaItemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video", "audio"], required: true },
    url: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const releaseTrackSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    audioUrl: { type: String, required: true },
  },
  { _id: true }
);

// A "release" is one upload of one or more MP3s sharing a single cover
// image — a single track, or a whole EP/LP, shown grouped in the
// discography (brief: "like SoundCloud").
const releaseSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    coverUrl: { type: String, required: true },
    tracks: {
      type: [releaseTrackSchema],
      validate: (v) => v.length > 0,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const locationSchema = new mongoose.Schema(
  {
    // GeoJSON point: [longitude, latitude]
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: undefined },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  { _id: false }
);

const swipeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, enum: ["like", "skip", "jam"], required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    name: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 600 },

    specialties: [{ type: String, enum: SPECIALTIES }],
    instruments: [{ type: String, enum: INSTRUMENTS }],
    vocalSkills: [{ type: String, enum: VOCAL_SKILLS }],
    goals: [{ type: String, enum: GOALS }],
    genres: [{ type: String, enum: GENRES }],

    location: locationSchema,
    media: [mediaItemSchema],
    // References a media[]._id — which uploaded photo is shown as the
    // profile picture. Falls back to the first image in `media` when unset.
    profilePhotoId: { type: mongoose.Schema.Types.ObjectId, default: null },
    // Discography: releases (single / EP / LP), each a cover + one or more
    // tracks. Full list is served from a dedicated endpoint, not
    // toPublicProfile, to keep every other profile payload (Discover,
    // Friends, Messages) light.
    releases: [releaseSchema],

    onboardingComplete: { type: Boolean, default: false },
    premium: { type: Boolean, default: false },

    // Swipe history feeds both the "already seen" filter and future
    // behavioural matching (brief section 50).
    swipes: [swipeSchema],
  },
  { timestamps: true }
);

userSchema.index({ location: "2dsphere" });
userSchema.index({ "swipes.user": 1 });

userSchema.methods.toPublicProfile = function toPublicProfile() {
  return {
    id: this._id,
    name: this.name,
    bio: this.bio,
    specialties: this.specialties,
    instruments: this.instruments,
    vocalSkills: this.vocalSkills,
    goals: this.goals,
    genres: this.genres,
    city: this.location?.city,
    media: this.media,
    profilePhotoId: this.profilePhotoId,
    trackCount:
      this.releases?.reduce((sum, release) => sum + release.tracks.length, 0) || 0,
    premium: this.premium,
  };
};

export default mongoose.model("User", userSchema);
