import { generateText } from "./geminiClient.js";

const SYSTEM = `You rank music releases for a listener on Jamminspot, a musician
discovery app. You will get the listener's favorite genres and a list of
candidate releases (each with an id, the artist's name, and its genres).

Return a JSON array of release id strings, ordered from the release this
listener would most enjoy to the one they'd enjoy least, based on genre
affinity and adjacency (e.g. someone into "metal" would also likely enjoy
"industrial" or "punk" releases more than "laiko" ones).

Output ONLY the JSON array of id strings — no prose, no markdown fences.`;

function releaseGenres(release) {
  return [...new Set(release.tracks.flatMap((t) => t.genres || []))];
}

// Deterministic fallback: plain genre-overlap count, used if the AI call
// fails or the listener has no genres set — keeps the feed usable without
// depending on the AI layer being up.
function sortByOverlap(listenerGenres, candidates) {
  const listenerSet = new Set(listenerGenres);
  return [...candidates].sort((a, b) => {
    const scoreA = releaseGenres(a.release).filter((g) => listenerSet.has(g)).length;
    const scoreB = releaseGenres(b.release).filter((g) => listenerSet.has(g)).length;
    return scoreB - scoreA;
  });
}

// Ranks non-friend releases by how well they match the listener's taste.
// `candidates` is [{ release, owner }]. Returns the same shape, reordered.
export async function rankReleasesByTaste(listenerGenres, candidates) {
  if (candidates.length <= 1) return candidates;
  if (!listenerGenres?.length) return candidates;

  try {
    const prompt = JSON.stringify({
      listenerGenres,
      releases: candidates.map((c) => ({
        id: c.release._id.toString(),
        artist: c.owner.name,
        genres: releaseGenres(c.release),
      })),
    });

    const text = await generateText({ system: SYSTEM, prompt });
    const match = text.match(/\[[\s\S]*\]/);
    const orderedIds = JSON.parse(match ? match[0] : text);

    const byId = new Map(candidates.map((c) => [c.release._id.toString(), c]));
    const ranked = [];
    for (const id of orderedIds) {
      const candidate = byId.get(id);
      if (candidate) {
        ranked.push(candidate);
        byId.delete(id);
      }
    }
    // Anything the model didn't mention (or invented) keeps its relative
    // order at the end rather than being dropped.
    ranked.push(...byId.values());
    return ranked;
  } catch (err) {
    console.error("[musicFeed] AI ranking failed, falling back to genre overlap:", err.message);
    return sortByOverlap(listenerGenres, candidates);
  }
}
