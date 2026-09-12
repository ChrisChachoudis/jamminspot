import { useRef, useState } from "react";
import api from "../api/client.js";
import { GENRES } from "../constants.js";

function toggleGenre(genres, value) {
  return genres.includes(value) ? genres.filter((g) => g !== value) : [...genres, value];
}

// Uploads one "release" — a single track, EP or LP — sharing one cover
// image across however many MP3s the artist picks (SoundCloud-style).
// Each track gets its own genre tags, used to match it to listeners' taste
// in the Music feed.
export default function UploadReleaseModal({ onClose, onUploaded }) {
  const [title, setTitle] = useState("");
  const [tracks, setTracks] = useState([]); // [{ file, genres: [] }]
  const [coverFile, setCoverFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const trackInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const canSubmit = title.trim() && tracks.length > 0 && coverFile && !submitting;
  const coverPreviewUrl = coverFile ? URL.createObjectURL(coverFile) : null;

  function addTrackFile(e) {
    const file = e.target.files?.[0];
    if (file) setTracks((list) => [...list, { file, genres: [] }]);
    e.target.value = "";
  }

  function removeTrack(index) {
    setTracks((list) => list.filter((_, i) => i !== index));
  }

  function toggleTrackGenre(index, genre) {
    setTracks((list) =>
      list.map((t, i) => (i === index ? { ...t, genres: toggleGenre(t.genres, genre) } : t))
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setError("");
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("cover", coverFile);
      tracks.forEach((t) => formData.append("audio", t.file));
      formData.append("trackGenres", JSON.stringify(tracks.map((t) => t.genres)));

      const { data } = await api.post("/users/me/releases", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUploaded(data.releases);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Could not upload the release");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Upload your music</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--jm-text-dim)] hover:text-[var(--jm-text)]"
          >
            ✕
          </button>
        </div>

        <label className="text-sm font-semibold text-[var(--jm-text-dim)] block mb-1">
          Title (single, EP or LP name)
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Midnight Signal EP"
          className="w-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--jm-jam)] mb-5"
        />

        <label className="text-sm font-semibold text-[var(--jm-text-dim)] block mb-2">
          Tracks
        </label>

        {tracks.length > 0 && (
          <div className="mb-2 space-y-3">
            {tracks.map((t, i) => (
              <div
                key={i}
                className="bg-[var(--jm-surface-2)] border border-[var(--jm-border)] rounded-xl p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">🎵</span>
                  <span className="flex-1 truncate text-sm">{t.file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeTrack(i)}
                    className="w-5 h-5 rounded-full bg-black/30 text-xs leading-5 shrink-0"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {GENRES.map((g) => {
                    const active = t.genres.includes(g.value);
                    return (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => toggleTrackGenre(i, g.value)}
                        className={`px-2 py-0.5 rounded-full text-[11px] border transition-colors ${
                          active
                            ? "bg-[var(--jm-jam)] border-[var(--jm-jam)] text-white"
                            : "bg-[var(--jm-surface)] border-[var(--jm-border)] text-[var(--jm-text-dim)]"
                        }`}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => trackInputRef.current?.click()}
          className="w-full border border-dashed border-[var(--jm-border)] rounded-xl py-4 text-center text-sm text-[var(--jm-text-dim)] hover:border-[var(--jm-jam)] hover:text-[var(--jm-jam)] mb-5"
        >
          {tracks.length === 0 ? "＋ Upload a track" : "＋ Upload another track (optional)"}
        </button>
        <input
          ref={trackInputRef}
          type="file"
          accept="audio/mpeg,.mp3"
          onChange={addTrackFile}
          className="hidden"
        />

        <label className="text-sm font-semibold text-[var(--jm-text-dim)] block mb-2">
          Cover image
        </label>

        {coverFile ? (
          <div className="flex items-center gap-3 bg-[var(--jm-surface-2)] border border-[var(--jm-border)] rounded-xl p-2 mb-1">
            <img src={coverPreviewUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
            <span className="flex-1 text-sm truncate">{coverFile.name}</span>
            <button
              type="button"
              onClick={() => setCoverFile(null)}
              className="w-6 h-6 rounded-full bg-black/30 text-xs shrink-0"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="w-full border border-dashed border-[var(--jm-border)] rounded-xl py-4 text-center text-sm text-[var(--jm-text-dim)] hover:border-[var(--jm-jam)] hover:text-[var(--jm-jam)]"
          >
            ＋ Upload cover image
          </button>
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,.jpg,.jpeg"
          onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
          className="hidden"
        />
        <p className="text-xs text-[var(--jm-text-dim)] mt-1.5">
          One JPG cover, shared by every track in this release.
        </p>

        {error && <p className="form-error mt-3">{error}</p>}

        <button type="submit" disabled={!canSubmit} className="btn-jam w-full mt-5">
          {submitting ? "Uploading…" : "Upload"}
        </button>
      </form>
    </div>
  );
}
