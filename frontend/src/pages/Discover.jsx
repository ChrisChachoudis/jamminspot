import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { coverPhotoUrl } from "../utils/media.js";

export default function Discover() {
  const [results, setResults] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [jamToast, setJamToast] = useState(null);
  const [listingCount, setListingCount] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  async function loadResults() {
    setLoading(true);
    const { data } = await api.get("/discover");
    setResults(data.results);
    setIndex(0);
    setLoading(false);
  }

  useEffect(() => {
    loadResults();
  }, []);

  const current = results[index];

  useEffect(() => {
    if (!current) return;
    setListingCount(0);
    api
      .get(`/listings/user/${current.profile.id}`)
      .then(({ data }) => setListingCount(data.listings.length))
      .catch(() => setListingCount(0));
  }, [current?.profile.id]);

  async function swipe(action) {
    if (!current) return;
    const { data } = await api.post("/discover/swipe", {
      targetUserId: current.profile.id,
      action,
    });
    if (data.jamCreated) {
      setJamToast(current.profile.name);
      setTimeout(() => setJamToast(null), 2500);
    }
    setIndex((i) => i + 1);
  }

  function messageCurrent() {
    // Everyone shown in Discover is, by definition, not a Friend yet
    // (already-Jammed people are excluded from Discover) — so this gate
    // always applies here, unlike on the Messages page for an existing Friend.
    if (!user?.premium) {
      alert(
        "Only Premium members can message musicians they haven't Jammed with yet. Jam them first, or upgrade to Premium."
      );
      return;
    }
    navigate(`/messages?to=${current.profile.id}`);
  }

  async function rewind() {
    try {
      await api.post("/discover/rewind");
      setIndex((i) => Math.max(0, i - 1));
    } catch (err) {
      alert(err.response?.data?.error || "Rewind unavailable");
    }
  }

  if (loading) {
    return <div className="p-10 text-center text-[var(--jm-text-dim)]">Loading musicians…</div>;
  }

  if (!current) {
    return (
      <div className="p-10 text-center text-[var(--jm-text-dim)]">
        <p className="mb-4">No more musicians to show right now.</p>
        <button onClick={loadResults} className="btn-jam !mt-0 px-6">
          Refresh
        </button>
      </div>
    );
  }

  const { profile, compatibility } = current;
  const photo = coverPhotoUrl(profile.media, profile.profilePhotoId);

  return (
    <div className="flex flex-col items-center py-8 px-4">
      {jamToast && (
        <div className="fixed top-20 bg-[var(--jm-jam)] text-white px-5 py-2 rounded-full text-sm font-semibold shadow-lg z-50">
          It's a Jam with {jamToast}! 🎸
        </div>
      )}

      <div className="w-full max-w-sm bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-2xl overflow-hidden">
        <button
          onClick={() => navigate(`/profile/${profile.id}`)}
          className="w-full h-80 bg-[var(--jm-surface-2)] flex items-center justify-center text-5xl"
        >
          {photo ? (
            <img src={photo} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            "🎵"
          )}
        </button>

        <div className="p-5">
          <div className="flex items-baseline justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{profile.name || "Musician"}</h2>
              {profile.trackCount > 0 && (
                <Link
                  to={`/discography/${profile.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex flex-col items-center text-[9px] text-[var(--jm-text-dim)] hover:text-[var(--jm-jam)]"
                  title="View discography"
                >
                  <span className="text-base leading-none">💽</span>
                  Discography
                </Link>
              )}
              {listingCount > 0 && (
                <Link
                  to={`/seller/${profile.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex flex-col items-center text-[9px] text-[var(--jm-text-dim)] hover:text-[var(--jm-jam)]"
                  title="View what they're selling"
                >
                  <span className="text-base leading-none">🛒</span>
                  Seller
                </Link>
              )}
            </div>
            {compatibility && (
              <span className="text-sm font-semibold text-[var(--jm-jam)]">
                {compatibility.score}% Jam Match
              </span>
            )}
          </div>
          {profile.city && <p className="text-sm text-[var(--jm-text-dim)]">{profile.city}</p>}

          {profile.bio && <p className="text-sm mt-3">{profile.bio}</p>}

          <div className="flex flex-wrap gap-1.5 mt-3">
            {profile.specialties?.map((s) => (
              <span
                key={s}
                className="text-xs px-2 py-1 rounded-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)]"
              >
                {s}
              </span>
            ))}
            {profile.genres?.slice(0, 5).map((g) => (
              <span
                key={g}
                className="text-xs px-2 py-1 rounded-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)]"
              >
                {g}
              </span>
            ))}
          </div>

          {compatibility?.reasons?.some((r) => r.type === "shared_genres") && (
            <p className="text-xs text-[var(--jm-text-dim)] mt-3">
              ✨ Why you might Jam:{" "}
              {compatibility.reasons
                .filter((r) => r.type === "shared_genres")
                .map((r) => r.value.join(", "))
                .join(", ")}{" "}
              in common
              {compatibility.distanceKm !== null && ` · ${compatibility.distanceKm} km away`}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6">
        <button onClick={rewind} className="btn-rewind w-11 h-11 text-lg" title="Rewind">
          ↺
        </button>
        <button onClick={() => swipe("skip")} className="btn-skip w-12 h-12 text-xl" title="Skip">
          ✕
        </button>
        <button
          onClick={messageCurrent}
          className="btn-message w-11 h-11 text-lg"
          title={user?.premium ? "Message" : "Message (Premium required)"}
        >
          💬
        </button>
        <button
          onClick={() => swipe("jam")}
          className="btn-jam !mt-0 px-6 py-3 text-base"
          title="Jam"
        >
          Jam
        </button>
      </div>
    </div>
  );
}
