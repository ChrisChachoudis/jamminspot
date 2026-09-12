import { useState } from "react";
import api from "../api/client.js";

// Uploads one "release" — a single track, EP or LP — sharing one cover
// image across however many MP3s the artist picks (SoundCloud-style).
export default function UploadReleaseModal({ onClose, onUploaded }) {
  const [title, setTitle] = useState("");
  const [audioFiles, setAudioFiles] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = title.trim() && audioFiles.length > 0 && coverFile && !submitting;

  function removeAudioFile(index) {
    setAudioFiles((files) => files.filter((_, i) => i !== index));
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
      audioFiles.forEach((file) => formData.append("audio", file));

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
          className="w-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--jm-jam)] mb-4"
        />

        <label className="text-sm font-semibold text-[var(--jm-text-dim)] block mb-1">
          Tracks (MP3 only — pick one for a single, several for an EP/LP)
        </label>
        <input
          type="file"
          accept="audio/mpeg,.mp3"
          multiple
          onChange={(e) => setAudioFiles(Array.from(e.target.files || []))}
          className="w-full text-sm mb-2"
        />
        {audioFiles.length > 0 && (
          <ul className="mb-4 space-y-1">
            {audioFiles.map((file, i) => (
              <li
                key={i}
                className="flex items-center justify-between text-xs bg-[var(--jm-surface-2)] rounded-lg px-2 py-1"
              >
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAudioFile(i)}
                  className="ml-2 text-[var(--jm-text-dim)] hover:text-[var(--jm-skip)]"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <label className="text-sm font-semibold text-[var(--jm-text-dim)] block mb-1">
          Cover image (JPG only, shared by all tracks)
        </label>
        <input
          type="file"
          accept="image/jpeg,.jpg,.jpeg"
          onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
          className="w-full text-sm"
        />

        {error && <p className="form-error mt-3">{error}</p>}

        <button type="submit" disabled={!canSubmit} className="btn-jam w-full mt-5">
          {submitting ? "Uploading…" : "Upload"}
        </button>
      </form>
    </div>
  );
}
