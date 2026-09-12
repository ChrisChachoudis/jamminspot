import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import Avatar from "../components/Avatar.jsx";
import { mediaUrl } from "../utils/media.js";

function ReleaseCard({ release }) {
  return (
    <Link
      to={`/discography/${release.artist.id}`}
      className="flex gap-3 bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-xl p-3 hover:border-[var(--jm-jam)] transition-colors"
    >
      <img
        src={mediaUrl({ url: release.coverUrl })}
        alt={release.title}
        className="w-16 h-16 rounded-lg object-cover shrink-0"
      />
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold truncate">{release.title}</h3>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Avatar media={release.artist.media} profilePhotoId={release.artist.profilePhotoId} name={release.artist.name} size={18} />
          <span className="text-xs text-[var(--jm-text-dim)] truncate">{release.artist.name}</span>
        </div>
        <p className="text-xs text-[var(--jm-text-dim)] mt-1">
          {release.trackCount} track{release.trackCount === 1 ? "" : "s"}
          {release.genres.length > 0 && ` · ${release.genres.slice(0, 3).join(", ")}`}
        </p>
      </div>
    </Link>
  );
}

export default function Music() {
  const [friendReleases, setFriendReleases] = useState([]);
  const [forYouReleases, setForYouReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/music/feed").then(({ data }) => {
      setFriendReleases(data.friendReleases);
      setForYouReleases(data.forYouReleases);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-10 text-center text-[var(--jm-text-dim)]">Loading music…</div>;
  }

  if (!friendReleases.length && !forYouReleases.length) {
    return (
      <div className="p-10 text-center text-[var(--jm-text-dim)]">
        No releases yet — check back once musicians start uploading music.
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-1">Music</h1>
      <p className="text-sm text-[var(--jm-text-dim)] mb-6">
        New releases from your Friends, then picks matched to your taste.
      </p>

      {friendReleases.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-[var(--jm-text-dim)] mb-2">
            New from your Friends
          </h2>
          <div className="space-y-2">
            {friendReleases.map((r) => (
              <ReleaseCard key={r.releaseId} release={r} />
            ))}
          </div>
        </div>
      )}

      {forYouReleases.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[var(--jm-text-dim)] mb-2">
            ✨ Picked for you
          </h2>
          <div className="space-y-2">
            {forYouReleases.map((r) => (
              <ReleaseCard key={r.releaseId} release={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
