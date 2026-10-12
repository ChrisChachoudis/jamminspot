import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { coverPhotoUrl, mediaUrl } from "../utils/media.js";

export default function Profile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jamStatus, setJamStatus] = useState(null); // null | "sending" | "sent" | "matched" | "error"
  const [listingCount, setListingCount] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [safetyNotice, setSafetyNotice] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get(`/users/${id}`)
      .then(({ data }) => setProfile(data.user))
      .catch((err) => setError(err.response?.data?.error || "Could not load profile"))
      .finally(() => setLoading(false));
    api
      .get(`/listings/user/${id}`)
      .then(({ data }) => setListingCount(data.listings.length))
      .catch(() => setListingCount(0));
  }, [id]);

  if (loading) return <div className="p-10 text-center text-[var(--jm-text-dim)]">Loading…</div>;
  if (error) return <div className="p-10 text-center text-[var(--jm-skip)]">{error}</div>;
  if (!profile) return null;

  const photo = coverPhotoUrl(profile.media, profile.profilePhotoId);
  const otherMedia = (profile.media || []).filter((m) => mediaUrl(m) !== photo);
  const isSelf = user?.id === profile.id;

  async function submitReport() {
    try {
      await api.post(`/users/${profile.id}/report`, {
        reason: reportReason,
        details: reportDetails,
      });
      setReportOpen(false);
      setReportReason("");
      setReportDetails("");
      setSafetyNotice("Thanks — we'll review this report. Consider blocking them too.");
    } catch (err) {
      setSafetyNotice(err.response?.data?.error || "Could not send the report");
    }
  }

  async function blockUser() {
    if (!window.confirm(`Block ${profile.name}? You won't see each other any more.`)) return;
    try {
      await api.post(`/users/${profile.id}/block`);
      navigate("/discover");
    } catch (err) {
      setSafetyNotice(err.response?.data?.error || "Could not block this user");
    }
  }

  async function addForJam() {
    setJamStatus("sending");
    try {
      const { data } = await api.post("/discover/swipe", {
        targetUserId: profile.id,
        action: "jam",
      });
      setJamStatus(data.jamCreated ? "matched" : "sent");
    } catch (err) {
      setJamStatus("error");
      setError(err.response?.data?.error || "Could not send a Jam request");
    }
  }

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
            {listingCount > 0 && (
              <Link
                to={`/seller/${profile.id}`}
                className="flex flex-col items-center text-[10px] text-[var(--jm-text-dim)] hover:text-[var(--jm-jam)]"
                title="View what they're selling"
              >
                <span className="text-lg leading-none">🛒</span>
                Seller
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

          {!isSelf && (
            <>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={addForJam}
                  disabled={jamStatus === "sending" || jamStatus === "sent" || jamStatus === "matched"}
                  className="btn-jam flex-1 !mt-0 disabled:opacity-60"
                >
                  {jamStatus === "matched"
                    ? "It's a Jam! 🎸"
                    : jamStatus === "sent"
                    ? "Jam request sent ✓"
                    : "Add for Jam"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/messages?to=${profile.id}`)}
                  className="btn-message flex-1 !mt-0 py-3"
                >
                  Message
                </button>
              </div>
              {jamStatus === "matched" && (
                <p className="text-xs text-[var(--jm-jam)] mt-2">
                  You're both in — check Friends to start chatting.
                </p>
              )}

              <div className="flex gap-4 mt-5 text-xs text-[var(--jm-text-dim)]">
                <button type="button" onClick={() => setReportOpen((o) => !o)} className="underline">
                  Report
                </button>
                <button type="button" onClick={blockUser} className="underline">
                  Block
                </button>
              </div>
              {safetyNotice && (
                <p className="text-xs text-[var(--jm-text-dim)] mt-2">{safetyNotice}</p>
              )}
              {reportOpen && (
                <div className="mt-3 bg-[var(--jm-surface-2)] border border-[var(--jm-border)] rounded-xl p-3">
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Why are you reporting this profile?</option>
                    <option value="spam">Spam</option>
                    <option value="fake_profile">Fake profile</option>
                    <option value="harassment">Harassment or hate</option>
                    <option value="inappropriate_content">Inappropriate content</option>
                    <option value="scam">Scam or fraud</option>
                    <option value="underage">Looks under 18</option>
                    <option value="other">Something else</option>
                  </select>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="Add details (optional)"
                    className="w-full mt-2 bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={submitReport}
                    disabled={!reportReason}
                    className="btn-jam !mt-2 px-5 disabled:opacity-50"
                  >
                    Send report
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
