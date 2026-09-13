// Blends several signals into one "Picked for you" ranking, each borrowed
// from a platform that does it well:
//   - AI genre relevance            (base signal — is this even their thing)
//   - Collaborative filtering        (Spotify: people who liked what you liked)
//   - Popularity with recency decay  (Instagram velocity + HN-style freshness)
//   - Friend social proof            (people you Jam with liked this)
// Combined additively (not a strict lexicographic sort) so no single signal
// can either dominate or be completely overridden by another.
const WEIGHTS = {
  relevance: 2, // AI genre-affinity rank, normalized 0..1
  collab: 1.5, // taste-neighbor likes, log-dampened
  popularity: 1, // likes decayed by release age
  friend: 1.2, // friend likes, log-dampened
};

const POPULARITY_GRAVITY = 1.2; // higher = older tracks fade faster
const MAX_PER_ARTIST = 2; // diversity cap in the head of the list

function ageDays(release) {
  return (Date.now() - new Date(release.createdAt).getTime()) / (1000 * 60 * 60 * 24);
}

function countLikesIn(track, idSet) {
  return track.likes.filter((id) => idSet.has(id.toString())).length;
}

// `candidates` — [{ track, release, owner }], not yet AI-ranked.
// `relevanceRank` — Map of trackId -> position in the AI's relevance order.
// `viewerId`, `viewerGenres`, `friendIds` describe the listener.
export function rankForYou({ candidates, relevanceRank, viewerId, viewerGenres, friendIds }) {
  if (!candidates.length) return [];

  // Collaborative filtering: find "taste neighbors" — anyone who liked a
  // track the viewer also liked — then boost tracks THEY liked too.
  const viewerLikedTrackIds = new Set(
    candidates
      .filter((c) => c.track.likes.some((id) => id.toString() === viewerId))
      .map((c) => c.track._id.toString())
  );
  const neighborIds = new Set();
  for (const c of candidates) {
    if (viewerLikedTrackIds.has(c.track._id.toString())) {
      for (const likerId of c.track.likes) {
        const s = likerId.toString();
        if (s !== viewerId) neighborIds.add(s);
      }
    }
  }

  const total = candidates.length;
  const genreSet = new Set(viewerGenres || []);

  const scored = candidates.map((c) => {
    const id = c.track._id.toString();
    const rank = relevanceRank.get(id) ?? total;
    const relevanceScore = total > 1 ? (total - rank) / total : 1;

    const collabCount = countLikesIn(c.track, neighborIds);
    const friendCount = countLikesIn(c.track, friendIds);
    const popularity = Math.log1p(c.track.likes.length) / Math.pow(ageDays(c.release) + 1, POPULARITY_GRAVITY);

    const score =
      relevanceScore * WEIGHTS.relevance +
      Math.log1p(collabCount) * WEIGHTS.collab +
      popularity * WEIGHTS.popularity +
      Math.log1p(friendCount) * WEIGHTS.friend;

    // One dominant reason per track, for the "Because you..." label —
    // priority order matches which signal is most persuasive to see.
    const matchedGenre = (c.track.genres || []).find((g) => genreSet.has(g));
    let reason = null;
    if (friendCount > 0) reason = "friend";
    else if (collabCount > 0) reason = "similar_taste";
    else if (matchedGenre) reason = { type: "genre", genre: matchedGenre };

    return { ...c, score, reason };
  });

  scored.sort((a, b) => b.score - a.score);

  // Diversity cap: an artist with many uploads shouldn't flood the feed —
  // push anything past MAX_PER_ARTIST to the tail, order preserved.
  const seenPerArtist = new Map();
  const head = [];
  const overflow = [];
  for (const item of scored) {
    const artistId = item.owner._id.toString();
    const count = seenPerArtist.get(artistId) || 0;
    if (count < MAX_PER_ARTIST) {
      head.push(item);
      seenPerArtist.set(artistId, count + 1);
    } else {
      overflow.push(item);
    }
  }
  const ordered = [...head, ...overflow];

  // Exploration slot: one track outside the listener's declared genres,
  // surfaced early so different sounds/artists still get discovered.
  if (genreSet.size && ordered.length > 5) {
    const wildcardIndex = ordered.findIndex(
      (item, i) => i > 4 && !item.reason && item.track.genres?.length && !item.track.genres.some((g) => genreSet.has(g))
    );
    if (wildcardIndex !== -1) {
      const [wildcard] = ordered.splice(wildcardIndex, 1);
      wildcard.reason = "wildcard";
      ordered.splice(4, 0, wildcard);
    }
  }

  return ordered;
}
