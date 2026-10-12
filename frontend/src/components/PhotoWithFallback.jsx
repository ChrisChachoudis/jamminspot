import { useState } from "react";

// Shows the photo, or a music-note placeholder when there is none or the
// stored file is gone (older uploads were lost before files moved to
// persistent storage).
export default function PhotoWithFallback({ src, alt, className = "w-full h-full object-cover" }) {
  const [failedSrc, setFailedSrc] = useState(null);
  if (src && failedSrc !== src) {
    return <img src={src} alt={alt} className={className} onError={() => setFailedSrc(src)} />;
  }
  return (
    <div className="w-full h-full flex items-center justify-center text-6xl text-[var(--jm-text-dim)]">
      🎵
    </div>
  );
}
