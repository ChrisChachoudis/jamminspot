import { generateText } from "./aiClient.js";

const SYSTEM = `You rank music tracks for a listener on Jamminspot, a musician
discovery app. You will get the listener's favorite genres and a list of
candidate tracks (each with an id, the artist's name, and its genres).

Return a JSON array of track id strings, ordered from the track this
listener would most enjoy to the one they'd enjoy least, based on genre
affinity and adjacency (e.g. someone into "metal" would also likely enjoy
"industrial" or "punk" tracks more than "laiko" ones).

Output ONLY the JSON array of id strings — no prose, no markdown fences.`;

// Deterministic fallback: plain genre-overlap count, used if the AI call
// fails, times out, or the listener has no genres set — keeps the feed
// usable without depending on the AI layer being up.
function sortByOverlap(listenerGenres, candidates) {
  const listenerSet = new Set(listenerGenres);
  return [...candidates].sort((a, b) => {
    const scoreA = (a.track.genres || []).filter((g) => listenerSet.has(g)).length;
    const scoreB = (b.track.genres || []).filter((g) => listenerSet.has(g)).length;
    return scoreB - scoreA;
  });
}

function reorderByIds(candidates, orderedIds) {
  const byId = new Map(candidates.map((c) => [c.track._id.toString(), c]));
  const ranked = [];
  for (const id of orderedIds) {
    const candidate = byId.get(id);
    if (candidate) {
      ranked.push(candidate);
      byId.delete(id);
    }
  }
  // Anything not in the stored order (new upload since we cached) keeps
  // its relative position at the end rather than being dropped.
  ranked.push(...byId.values());
  return ranked;
}

// Cap how long we'll wait on the AI call — the Music feed should never
// feel "stuck" just because a model response is slow. Past this, fall
// back to the deterministic sort like any other AI failure.
const AI_TIMEOUT_MS = 4000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("AI ranking timed out")), ms)),
  ]);
}

// The AI call is the slow part (seconds), and re-running it on every page
// load is both wasteful and makes the feed feel sluggish for no benefit —
// a listener's taste and a given set of candidate tracks don't change
// between refreshes. Cache the ranking per listener, keyed by exactly
// which tracks were ranked, so a new upload naturally invalidates it.
const rankingCache = new Map(); // userId -> { poolKey, order: string[], expiresAt }
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function poolKeyFor(candidates) {
  return candidates
    .map((c) => c.track._id.toString())
    .sort()
    .join(",");
}

// Ranks non-friend tracks by how well they match the listener's taste.
// `candidates` is [{ track, release, owner }]. `cacheKey` (typically the
// listener's userId) lets repeat requests skip the AI call entirely.
// Returns candidates reordered by relevance (most to least).
export async function rankTracksByTaste(listenerGenres, candidates, cacheKey) {
  if (candidates.length <= 1) return candidates;
  if (!listenerGenres?.length) return candidates;

  const poolKey = poolKeyFor(candidates);

  if (cacheKey) {
    const cached = rankingCache.get(cacheKey);
    if (cached && cached.poolKey === poolKey && cached.expiresAt > Date.now()) {
      return reorderByIds(candidates, cached.order);
    }
  }

  let ranked;
  try {
    const prompt = JSON.stringify({
      listenerGenres,
      tracks: candidates.map((c) => ({
        id: c.track._id.toString(),
        artist: c.owner.name,
        genres: c.track.genres || [],
      })),
    });

    const text = await withTimeout(generateText({ system: SYSTEM, prompt }), AI_TIMEOUT_MS);
    const match = text.match(/\[[\s\S]*\]/);
    const orderedIds = JSON.parse(match ? match[0] : text);
    ranked = reorderByIds(candidates, orderedIds);
  } catch (err) {
    console.error("[musicFeed] AI ranking failed, falling back to genre overlap:", err.message);
    ranked = sortByOverlap(listenerGenres, candidates);
  }

  if (cacheKey) {
    rankingCache.set(cacheKey, {
      poolKey,
      order: ranked.map((c) => c.track._id.toString()),
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
  }

  return ranked;
}
