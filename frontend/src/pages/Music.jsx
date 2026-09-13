import { useEffect, useState } from "react";
import api from "../api/client.js";
import TrackRow from "../components/TrackRow.jsx";

const TABS = [
  { value: "forYou", label: "✨ Picked for you" },
  { value: "thisWeek", label: "🗓️ This week" },
  { value: "friends", label: "Friends" },
];

export default function Music() {
  const [friendTracks, setFriendTracks] = useState([]);
  const [forYouTracks, setForYouTracks] = useState([]);
  const [newThisWeek, setNewThisWeek] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("forYou");

  useEffect(() => {
    api.get("/music/feed").then(({ data }) => {
      setFriendTracks(data.friendTracks);
      setForYouTracks(data.forYouTracks);
      setNewThisWeek(data.newThisWeek);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-10 text-center text-[var(--jm-text-dim)]">Loading music…</div>;
  }

  if (!friendTracks.length && !forYouTracks.length && !newThisWeek.length) {
    return (
      <div className="p-10 text-center text-[var(--jm-text-dim)]">
        No releases yet — check back once musicians start uploading music.
      </div>
    );
  }

  function renderTrack(t) {
    return (
      <TrackRow
        key={t.trackId}
        trackId={t.trackId}
        title={t.title}
        audioUrl={t.audioUrl}
        coverUrl={t.coverUrl}
        likeCount={t.likeCount}
        likedByMe={t.likedByMe}
        artistId={t.artist.id}
        artistName={t.artist.name}
        artistMedia={t.artist.media}
        artistProfilePhotoId={t.artist.profilePhotoId}
        releaseId={t.releaseId}
        releaseTitle={t.releaseTitle}
        reason={t.reason}
        showArtist
      />
    );
  }

  const tracksByTab = { forYou: forYouTracks, thisWeek: newThisWeek, friends: friendTracks };
  const emptyMessage = {
    forYou: "No picks yet — check back once musicians start uploading music.",
    thisWeek: "No new releases this week yet.",
    friends: "No new tracks from your Friends yet.",
  };
  const activeTracks = tracksByTab[tab];

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-1">Music</h1>
      <p className="text-sm text-[var(--jm-text-dim)] mb-4">
        New tracks from your Friends, then picks matched to your taste.
      </p>

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              tab === t.value
                ? "bg-[var(--jm-jam)] text-white"
                : "bg-[var(--jm-surface-2)] text-[var(--jm-text-dim)] hover:text-[var(--jm-text)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTracks.length > 0 ? (
        <div className="space-y-2">{activeTracks.map(renderTrack)}</div>
      ) : (
        <p className="text-sm text-[var(--jm-text-dim)]">{emptyMessage[tab]}</p>
      )}
    </div>
  );
}
