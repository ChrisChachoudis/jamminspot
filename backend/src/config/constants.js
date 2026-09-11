// Core taxonomy for Jamminspot profiles.
// Kept as plain string enums (not free text) so Discover filters and the
// compatibility scorer can compare values directly.

export const SPECIALTIES = [
  "instrumentalist",
  "vocalist",
  "producer",
  "dj",
  "sound_engineer",
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
];

export const VOCAL_SKILLS = [
  "lead_vocals",
  "backing_vocals",
  "rap",
  "harmony",
  "choir",
];

export const GOALS = [
  "casual_jam",
  "join_band",
  "form_band",
  "find_collaborators",
  "record_music",
  "produce_music",
  "find_vocalists",
  "find_musicians_for_project",
  "live_performances",
  "session_work",
  "remote_collaboration",
  "meet_musicians",
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
];

// Upper bound (km) for each distance band, used by the matching/filter logic.
export const DISTANCE_BANDS = {
  same_city: 0,
  nearby: 150,
  far: 400,
  long: 800,
  remote: Infinity,
};

export function distanceBand(km) {
  if (km <= DISTANCE_BANDS.same_city) return "same_city";
  if (km <= DISTANCE_BANDS.nearby) return "nearby";
  if (km <= DISTANCE_BANDS.far) return "far";
  if (km <= DISTANCE_BANDS.long) return "long";
  return "remote";
}
