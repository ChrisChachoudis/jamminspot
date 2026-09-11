import { coverPhotoUrl } from "../utils/media.js";

export default function Avatar({ media, profilePhotoId, name, size = 40, className = "" }) {
  const photo = coverPhotoUrl(media, profilePhotoId);
  const style = { width: size, height: size, minWidth: size };

  if (photo) {
    return (
      <img
        src={photo}
        alt={name || ""}
        style={style}
        className={`rounded-full object-cover border border-[var(--jm-border)] ${className}`}
      />
    );
  }

  return (
    <div
      style={style}
      className={`rounded-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)] flex items-center justify-center font-semibold text-[var(--jm-text-dim)] ${className}`}
    >
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}
