import { useState } from "react";

// Round "$" badge with a tiny "donate" label, pinned to the top-right corner
// of the nearest `relative` parent. Only renders when the member has set a
// donation link. Donations go straight to the member's own page — Jamminspot
// never handles the money — so we warn before leaving.
export default function DonateButton({ url, name }) {
  const [open, setOpen] = useState(false);
  if (!url) return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        title={`Donate to ${name || "this musician"}`}
        aria-label={`Donate to ${name || "this musician"}`}
        className="absolute top-3 right-3 z-10 flex flex-col items-center gap-0.5 group"
      >
        <span className="w-10 h-10 rounded-full bg-[var(--jm-rewind)] text-[#2e1c02] flex items-center justify-center text-lg font-extrabold shadow-lg ring-2 ring-black/30 group-hover:scale-105 transition-transform">
          $
        </span>
        <span className="text-[10px] leading-none font-semibold text-white drop-shadow">donate</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-2">Donate to {name || "this musician"}</h2>
            <p className="text-sm text-[var(--jm-text-dim)] mb-4">
              You'll leave Jamminspot and go to {name ? `${name}'s` : "their"} own donation page.
              Donations are voluntary and handled entirely by that service — Jamminspot isn't
              involved and can't refund or verify them. Only donate to people you trust.
            </p>
            <div className="flex gap-3">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                onClick={() => setOpen(false)}
                className="btn-jam flex-1 !mt-0 text-center py-3"
              >
                Continue
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-5 rounded-full text-sm font-semibold bg-[var(--jm-surface-2)] text-[var(--jm-text-dim)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
