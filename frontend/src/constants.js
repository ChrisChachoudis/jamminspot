// Mirrors backend/src/config/constants.js — keep both in sync when the
// taxonomy changes.

export const SPECIALTIES = [
  { value: "instrumentalist", label: "Instrumentalist" },
  { value: "vocalist", label: "Vocalist" },
  { value: "producer", label: "Music Producer" },
  { value: "dj", label: "DJ" },
  { value: "sound_engineer", label: "Sound Engineer" },
];

export const INSTRUMENTS = [
  "guitar",
  "bass",
  "drums",
  "keys",
  "piano",
  "synth",
  "violin",
  "saxophone",
  "trumpet",
  "cello",
  "flute",
  "percussion",
  "other",
].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }));

export const VOCAL_SKILLS = [
  { value: "lead_vocals", label: "Lead Vocals" },
  { value: "backing_vocals", label: "Backing Vocals" },
  { value: "rap", label: "Rap" },
  { value: "harmony", label: "Harmony" },
  { value: "choir", label: "Choir" },
];

export const GOALS = [
  { value: "casual_jam", label: "Casual Jam" },
  { value: "join_band", label: "Join a Band" },
  { value: "form_band", label: "Form a Band" },
  { value: "find_collaborators", label: "Find Collaborators" },
  { value: "record_music", label: "Record Music" },
  { value: "produce_music", label: "Produce Music" },
  { value: "find_vocalists", label: "Find Vocalists" },
  { value: "find_musicians_for_project", label: "Find Musicians for a Project" },
  { value: "live_performances", label: "Live Performances" },
  { value: "session_work", label: "Session Work" },
  { value: "remote_collaboration", label: "Remote Collaboration" },
  { value: "meet_musicians", label: "Meet Musicians" },
];

export const GENRES = [
  "pop",
  "rock",
  "hip_hop",
  "rnb",
  "laiko",
  "entekhno",
  "edm",
  "industrial",
  "punk",
  "indie_alternative",
  "metal",
  "folk",
  "acoustic",
  "blues",
  "jazz",
  "classical",
  "rempetiko",
  "ambient",
  "experimental",
  "spoken_word",
  "cinematic",
  "reggae",
  "funk",
].map((v) => ({ value: v, label: v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) }));

// Mirrors backend/src/models/Listing.js LISTING_CATEGORIES.
export const LISTING_CATEGORIES = [
  { value: "instruments", label: "Instruments" },
  { value: "gear", label: "Gear & Equipment" },
  { value: "digital", label: "Digital (beats, samples, presets)" },
  { value: "services", label: "Services (lessons, mixing, session work)" },
  { value: "merch", label: "Merch" },
  { value: "other", label: "Other" },
];
