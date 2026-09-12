import { useEffect, useState } from "react";
import api from "../api/client.js";
import TrackRow from "../components/TrackRow.jsx";

export default function Music() {
  const [friendTracks, setFriendTracks] = useState([]);
  const [forYouTracks, setForYouTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/music/feed").then(({ data }) => {
      setFriendTracks(data.friendTracks);
      setForYouTracks(data.forYouTracks);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-10 text-center text-[var(--jm-text-dim)]">Loading music…</div>;
  }

  if (!friendTracks.length && !forYouTracks.length) {
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
        showArtist
      />
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-1">Music</h1>
      <p className="text-sm text-[var(--jm-text-dim)] mb-6">
        New tracks from your Friends, then picks matched to your taste.
      </p>

      {friendTracks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-[var(--jm-text-dim)] mb-2">
            New from your Friends
          </h2>
          <div className="space-y-2">{friendTracks.map(renderTrack)}</div>
        </div>
      )}

      {forYouTracks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[var(--jm-text-dim)] mb-2">
            ✨ Picked for you
          </h2>
          <div className="space-y-2">{forYouTracks.map(renderTrack)}</div>
        </div>
      )}
    </div>
  );
}
