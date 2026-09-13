// Plain, explainable compatibility scoring (brief #37, #49).
// No AI/LLM here on purpose: this must stay fast and deterministic so it
// can run over every Discover candidate. An AI-driven score can be added
// later as an alternative "explain" layer on top of this.

function overlapRatio(a = [], b = []) {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  const shared = a.filter((x) => setB.has(x));
  return shared.length / Math.min(a.length, b.length);
}

export function distanceKm([lon1, lat1], [lon2, lat2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Weights are intentionally simple and tunable; sum to 1.
const WEIGHTS = {
  genres: 0.35,
  goals: 0.25,
  instrumentsComplement: 0.2,
  distance: 0.2,
};

export function computeCompatibility(userA, userB) {
  const reasons = [];

  const genreScore = overlapRatio(userA.genres, userB.genres);
  const sharedGenres = (userA.genres || []).filter((g) =>
    (userB.genres || []).includes(g)
  );
  if (sharedGenres.length) reasons.push({ type: "shared_genres", value: sharedGenres });

  const goalScore = overlapRatio(userA.goals, userB.goals);
  const sharedGoals = (userA.goals || []).filter((g) => (userB.goals || []).includes(g));
  if (sharedGoals.length) reasons.push({ type: "shared_goals", value: sharedGoals });

  // Complementary specialties score higher than identical ones — a
  // producer looking for a vocalist should rank vocalists highly.
  const sameSpecialty = (userA.specialties || []).some((s) =>
    (userB.specialties || []).includes(s)
  );
  const complementScore = sameSpecialty ? 0.4 : 0.85;
  reasons.push({
    type: "specialty",
    value: { you: userA.specialties, them: userB.specialties },
  });

  let distanceScore = 0.5;
  let km = null;
  if (userA.location?.coordinates && userB.location?.coordinates) {
    km = distanceKm(userA.location.coordinates, userB.location.coordinates);
    distanceScore = Math.max(0, 1 - km / 800);
    reasons.push({ type: "distance_km", value: Math.round(km) });
  }

  const score =
    genreScore * WEIGHTS.genres +
    goalScore * WEIGHTS.goals +
    complementScore * WEIGHTS.instrumentsComplement +
    distanceScore * WEIGHTS.distance;

  return {
    score: Math.round(score * 100),
    reasons,
    distanceKm: km === null ? null : Math.round(km),
  };
}
