import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/client.js";
import { coverPhotoUrl, mediaUrl } from "../utils/media.js";

export default function Profile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get(`/users/${id}`)
      .then(({ data }) => setProfile(data.user))
      .catch((err) => setError(err.response?.data?.error || "Could not load profile"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-10 text-center text-[var(--jm-text-dim)]">Loading…</div>;
  if (error) return <div className="p-10 text-center text-[var(--jm-skip)]">{error}</div>;
  if (!profile) return null;

  const photo = coverPhotoUrl(profile.media, profile.profilePhotoId);
  const otherMedia = (profile.media || []).filter((m) => mediaUrl(m) !== photo);

  return (
    <div className="max-w-xl mx-auto p-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-sm text-[var(--jm-text-dim)] mb-4"
      >
        ← Back
      </button>

      <div className="bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-2xl overflow-hidden">
        <div className="h-72 bg-[var(--jm-surface-2)] flex items-center justify-center text-6xl">
          {photo ? (
            <img src={photo} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            "🎵"
          )}
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{profile.name}</h1>
            {profile.trackCount > 0 && (
              <Link
                to={`/discography/${profile.id}`}
                className="flex flex-col items-center text-[10px] text-[var(--jm-text-dim)] hover:text-[var(--jm-jam)]"
                title="View discography"
              >
                <span className="text-lg leading-none">💽</span>
                Discography
              </Link>
            )}
          </div>
          {profile.city && <p className="text-sm text-[var(--jm-text-dim)]">{profile.city}</p>}

          {profile.bio && <p className="text-sm mt-4">{profile.bio}</p>}

          <div className="flex flex-wrap gap-1.5 mt-4">
            {profile.specialties?.map((s) => (
              <span
                key={s}
                className="text-xs px-2 py-1 rounded-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)]"
              >
                {s}
              </span>
            ))}
            {profile.instruments?.map((i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)]"
              >
                {i}
              </span>
            ))}
            {profile.vocalSkills?.map((v) => (
              <span
                key={v}
                className="text-xs px-2 py-1 rounded-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)]"
              >
                {v}
              </span>
            ))}
          </div>

          {profile.genres?.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-[var(--jm-text-dim)] mb-1.5">Genres</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.genres.map((g) => (
                  <span
                    key={g}
                    className="text-xs px-2 py-1 rounded-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)]"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.goals?.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-[var(--jm-text-dim)] mb-1.5">
                Looking for
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.goals.map((g) => (
                  <span
                    key={g}
                    className="text-xs px-2 py-1 rounded-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)]"
                  >
                    {g.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {otherMedia.length > 0 && (
            <div className="mt-5">
              <h3 className="text-xs font-semibold text-[var(--jm-text-dim)] mb-1.5">Gallery</h3>
              <div className="grid grid-cols-3 gap-2">
                {otherMedia.map((item) => (
                  <div
                    key={item._id}
                    className="aspect-square bg-[var(--jm-surface-2)] rounded-lg overflow-hidden border border-[var(--jm-border)]"
                  >
                    {item.type === "image" && (
                      <img src={mediaUrl(item)} alt="" className="w-full h-full object-cover" />
                    )}
                    {item.type === "video" && (
                      <video src={mediaUrl(item)} className="w-full h-full object-cover" />
                    )}
                    {item.type === "audio" && (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        🎵
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate(`/messages?to=${profile.id}`)}
            className="btn-jam w-full mt-6"
          >
            Message
          </button>
        </div>
      </div>
    </div>
  );
}
