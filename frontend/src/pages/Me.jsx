import { useState } from "react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { coverPhotoUrl, mediaUrl } from "../utils/media.js";

export default function Me() {
  const { user, refreshUser } = useAuth();
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [settingPhotoId, setSettingPhotoId] = useState(null);

  if (!user) return null;

  const photo = coverPhotoUrl(user.media, user.profilePhotoId);

  async function uploadFiles(fileList) {
    setMediaError("");
    setMediaUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const formData = new FormData();
        formData.append("file", file);
        await api.post("/users/me/media", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      await refreshUser();
    } catch (err) {
      setMediaError(err.response?.data?.error || "Could not upload — try a smaller file");
    } finally {
      setMediaUploading(false);
    }
  }

  async function removeMedia(mediaId) {
    setMediaError("");
    try {
      await api.delete(`/users/me/media/${mediaId}`);
      await refreshUser();
    } catch (err) {
      setMediaError(err.response?.data?.error || "Could not remove file");
    }
  }

  async function setProfilePhoto(mediaId) {
    setMediaError("");
    setSettingPhotoId(mediaId);
    try {
      await api.patch("/users/me/profile-photo", { mediaId });
      await refreshUser();
    } catch (err) {
      setMediaError(err.response?.data?.error || "Could not set profile photo");
    } finally {
      setSettingPhotoId(null);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-2xl overflow-hidden">
        <div className="h-72 bg-[var(--jm-surface-2)] flex items-center justify-center text-6xl">
          {photo ? (
            <img src={photo} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            "🎵"
          )}
        </div>

        <div className="p-5">
          <h1 className="text-xl font-bold">{user.name}</h1>
          {user.city && <p className="text-sm text-[var(--jm-text-dim)]">{user.city}</p>}

          {user.bio && <p className="text-sm mt-4">{user.bio}</p>}

          <div className="flex flex-wrap gap-1.5 mt-4">
            {user.specialties?.map((s) => (
              <span
                key={s}
                className="text-xs px-2 py-1 rounded-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)]"
              >
                {s}
              </span>
            ))}
            {user.instruments?.map((i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)]"
              >
                {i}
              </span>
            ))}
            {user.genres?.map((g) => (
              <span
                key={g}
                className="text-xs px-2 py-1 rounded-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)]"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold mb-1">Your photos</h2>
        <p className="text-sm text-[var(--jm-text-dim)] mb-4">
          Choose which photo shows as your profile picture across Jamminspot.
        </p>

        <label className="block border border-dashed border-[var(--jm-border)] rounded-xl p-6 text-center text-[var(--jm-text-dim)] text-sm cursor-pointer hover:border-[var(--jm-jam)] mb-4">
          {mediaUploading ? "Uploading…" : "Click to add photos, videos or audio"}
          <input
            type="file"
            accept="image/*,video/*,audio/*"
            multiple
            disabled={mediaUploading}
            onChange={(e) => {
              if (e.target.files?.length) uploadFiles(e.target.files);
              e.target.value = "";
            }}
            className="hidden"
          />
        </label>

        {mediaError && <p className="form-error mb-3">{mediaError}</p>}

        {user.media?.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {user.media.map((item) => {
              const isProfilePhoto = mediaUrl(item) === photo;
              return (
                <div
                  key={item._id}
                  className={`relative aspect-square bg-[var(--jm-surface-2)] rounded-lg overflow-hidden border-2 ${
                    isProfilePhoto ? "border-[var(--jm-jam)]" : "border-[var(--jm-border)]"
                  }`}
                >
                  {item.type === "image" && (
                    <img src={mediaUrl(item)} alt="" className="w-full h-full object-cover" />
                  )}
                  {item.type === "video" && (
                    <video src={mediaUrl(item)} className="w-full h-full object-cover" />
                  )}
                  {item.type === "audio" && (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🎵</div>
                  )}

                  {isProfilePhoto && (
                    <span className="absolute top-1 left-1 text-[10px] font-semibold bg-[var(--jm-jam)] text-white px-1.5 py-0.5 rounded-full">
                      Profile
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => removeMedia(item._id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs leading-6"
                  >
                    ✕
                  </button>

                  {item.type === "image" && !isProfilePhoto && (
                    <button
                      type="button"
                      onClick={() => setProfilePhoto(item._id)}
                      disabled={settingPhotoId === item._id}
                      className="absolute bottom-1 left-1 right-1 text-[10px] font-semibold bg-black/60 text-white rounded-full py-1 disabled:opacity-50"
                    >
                      {settingPhotoId === item._id ? "Setting…" : "Set as profile"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
