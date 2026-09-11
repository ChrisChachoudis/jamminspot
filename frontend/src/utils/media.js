import { MEDIA_BASE_URL } from "../api/client.js";

export function mediaUrl(item) {
  return `${MEDIA_BASE_URL}${item.url}`;
}

// Prefers the explicitly-chosen profilePhotoId; falls back to the first
// uploaded image when unset or no longer valid.
export function coverPhotoUrl(media, profilePhotoId) {
  if (profilePhotoId) {
    const chosen = media?.find((m) => m._id === profilePhotoId);
    if (chosen) return mediaUrl(chosen);
  }
  const photo = media?.find((m) => m.type === "image");
  return photo ? mediaUrl(photo) : null;
}
