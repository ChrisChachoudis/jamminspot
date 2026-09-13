import { Link } from "react-router-dom";
import Avatar from "./Avatar.jsx";
import LikeButton from "./LikeButton.jsx";
import { mediaUrl } from "../utils/media.js";

// One track: cover, title (+ optional artist link), player, and a like
// button — reused in the Music feed and on an artist's Discography page.
// Flat props (not a nested object) so each caller can pass exactly what it
// has without both needing to agree on one shape.
export default function TrackRow({
  trackId,
  title,
  audioUrl,
  coverUrl,
  likeCount,
  likedByMe,
  artistId,
  artistName,
  artistMedia,
  artistProfilePhotoId,
  releaseId,
  releaseTitle,
  reason,
  showArtist = false,
}) {
  return (
    <div className="bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-xl p-3 flex gap-3">
      <img src={mediaUrl({ url: coverUrl })} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{title}</p>
        {showArtist && (
          <Link
            to={`/discography/${artistId}`}
            className="flex items-center gap-1.5 mt-0.5 hover:text-[var(--jm-jam)]"
          >
            <Avatar media={artistMedia} profilePhotoId={artistProfilePhotoId} name={artistName} size={16} />
            <span className="text-xs text-[var(--jm-text-dim)] truncate">
              {artistName}
              {releaseTitle ? ` · ${releaseTitle}` : ""}
            </span>
          </Link>
        )}
        <audio controls src={mediaUrl({ url: audioUrl })} className="w-full mt-1.5" />
        {reason && <p className="text-[11px] text-[var(--jm-jam)] mt-1">{reason}</p>}
      </div>
      <div className="flex items-center">
        <LikeButton
          artistId={artistId}
          releaseId={releaseId}
          trackId={trackId}
          likeCount={likeCount}
          likedByMe={likedByMe}
        />
      </div>
    </div>
  );
}
