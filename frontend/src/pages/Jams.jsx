import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import Avatar from "../components/Avatar.jsx";

// Inbox of incoming Jam requests: people who Jammed you that you haven't
// responded to. Accept (tick) Jams them back -> they become a Friend.
// Reject (x) Skips them -> the request is dismissed for good.
export default function Jams() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);

  useEffect(() => {
    api.get("/users/me/admirers").then(({ data }) => {
      setRequests(data.admirers);
      setLoading(false);
    });
  }, []);

  async function respond(profileId, action) {
    setRespondingId(profileId);
    try {
      await api.post("/discover/swipe", { targetUserId: profileId, action });
      setRequests((list) => list.filter((r) => r.profile.id !== profileId));
    } finally {
      setRespondingId(null);
    }
  }

  if (loading) {
    return <div className="p-10 text-center text-[var(--jm-text-dim)]">Loading Jam requests…</div>;
  }

  if (!requests.length) {
    return (
      <div className="p-10 text-center text-[var(--jm-text-dim)]">
        No pending Jam requests right now.
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-1">Jam requests</h1>
      <p className="text-sm text-[var(--jm-text-dim)] mb-4">
        These musicians want to Jam with you. Accept to become friends, or reject to dismiss.
      </p>

      <div className="space-y-2">
        {requests.map(({ profile, compatibility }) => (
          <div
            key={profile.id}
            className="flex items-center justify-between bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-xl p-3"
          >
            <Link to={`/profile/${profile.id}`} className="flex items-center gap-3 min-w-0">
              <Avatar
                media={profile.media}
                profilePhotoId={profile.profilePhotoId}
                name={profile.name}
                size={40}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">{profile.name}</span>
                  {compatibility && (
                    <span className="text-xs font-semibold text-[var(--jm-jam)] shrink-0">
                      {compatibility.score}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--jm-text-dim)] truncate">
                  {profile.specialties?.join(", ")} {profile.city ? `· ${profile.city}` : ""}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => respond(profile.id, "skip")}
                disabled={respondingId === profile.id}
                className="btn-skip w-9 h-9 text-base disabled:opacity-40"
                title="Reject"
              >
                ✕
              </button>
              <button
                type="button"
                onClick={() => respond(profile.id, "jam")}
                disabled={respondingId === profile.id}
                className="w-9 h-9 rounded-full text-base font-bold bg-[var(--jm-jam)] text-white disabled:opacity-40"
                title="Accept"
              >
                ✓
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
