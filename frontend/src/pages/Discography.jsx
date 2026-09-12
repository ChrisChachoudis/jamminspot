import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client.js";
import { mediaUrl } from "../utils/media.js";
import LikeButton from "../components/LikeButton.jsx";

export default function Discography() {
  const { id } = useParams();
  const [name, setName] = useState("");
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get(`/users/${id}/releases`)
      .then(({ data }) => {
        setName(data.name);
        setReleases(data.releases);
      })
      .catch((err) => setError(err.response?.data?.error || "Could not load discography"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-10 text-center text-[var(--jm-text-dim)]">Loading…</div>;
  if (error) return <div className="p-10 text-center text-[var(--jm-skip)]">{error}</div>;

  const trackCount = releases.reduce((sum, r) => sum + r.tracks.length, 0);

  return (
    <div className="max-w-xl mx-auto p-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-sm text-[var(--jm-text-dim)] mb-4"
      >
        ← Back
      </button>

      <h1 className="text-xl font-bold mb-1">💽 {name}'s Discography</h1>
      <p className="text-sm text-[var(--jm-text-dim)] mb-6">
        {trackCount} track{trackCount === 1 ? "" : "s"} · {releases.length} release
        {releases.length === 1 ? "" : "s"}
      </p>

      {!releases.length && (
        <p className="text-sm text-[var(--jm-text-dim)]">No releases uploaded yet.</p>
      )}

      <div className="space-y-6">
        {releases.map((release) => (
          <div
            key={release._id}
            className="bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-xl overflow-hidden"
          >
            <div className="flex gap-4 p-4">
              <img
                src={mediaUrl({ url: release.coverUrl })}
                alt={release.title}
                className="w-20 h-20 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{release.title}</h3>
                <p className="text-xs text-[var(--jm-text-dim)]">
                  {release.tracks.length} track{release.tracks.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="divide-y divide-[var(--jm-border)] border-t border-[var(--jm-border)]">
              {release.tracks.map((track, i) => (
                <div key={track._id} className="p-3 flex items-center gap-3">
                  <span className="text-xs text-[var(--jm-text-dim)] w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate mb-1">{track.title}</p>
                    <audio controls src={mediaUrl({ url: track.audioUrl })} className="w-full" />
                  </div>
                  <LikeButton
                    artistId={id}
                    releaseId={release._id}
                    trackId={track._id}
                    likeCount={track.likeCount}
                    likedByMe={track.likedByMe}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
