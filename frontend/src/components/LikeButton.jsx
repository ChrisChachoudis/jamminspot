import { useState } from "react";
import api from "../api/client.js";

// Toggles a like on one track. Kept as a standalone control (not baked
// into TrackRow) so pages that lay tracks out differently — a flat feed
// row vs. a numbered list inside a release — can still reuse it.
export default function LikeButton({ artistId, releaseId, trackId, likeCount, likedByMe }) {
  const [liked, setLiked] = useState(likedByMe);
  const [count, setCount] = useState(likeCount);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setCount((prev) => (wasLiked ? prev - 1 : prev + 1));
    try {
      const { data } = await api.post(
        `/users/${artistId}/releases/${releaseId}/tracks/${trackId}/like`
      );
      setLiked(data.liked);
      setCount(data.likeCount);
    } catch {
      setLiked(wasLiked);
      setCount((prev) => (wasLiked ? prev + 1 : prev - 1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex items-center gap-1 text-sm shrink-0 ${
        liked ? "text-[var(--jm-jam)]" : "text-[var(--jm-text-dim)]"
      }`}
      title={liked ? "Unlike" : "Like"}
    >
      <span>{liked ? "♥" : "♡"}</span>
      <span className="text-xs">{count}</span>
    </button>
  );
}
