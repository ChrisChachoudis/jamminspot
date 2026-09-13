import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client.js";
import Avatar from "../components/Avatar.jsx";
import { mediaUrl } from "../utils/media.js";
import { LISTING_CATEGORIES } from "../constants.js";

export default function Listing() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError("");
    setActivePhoto(0);
    api
      .get(`/listings/${id}`)
      .then(({ data }) => setListing(data.listing))
      .catch((err) => setError(err.response?.data?.error || "Could not load this listing"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-10 text-center text-[var(--jm-text-dim)]">Loading…</div>;
  if (error) return <div className="p-10 text-center text-[var(--jm-skip)]">{error}</div>;
  if (!listing) return null;

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
        <div className="w-full aspect-square bg-[var(--jm-surface-2)]">
          <img
            src={mediaUrl({ url: listing.photos[activePhoto] })}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        </div>

        {listing.photos.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto">
            {listing.photos.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActivePhoto(i)}
                className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 ${
                  i === activePhoto ? "border-[var(--jm-jam)]" : "border-[var(--jm-border)]"
                }`}
              >
                <img src={mediaUrl({ url })} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold">{listing.title}</h1>
            <span className="text-xl font-bold text-[var(--jm-jam)] shrink-0">
              €{listing.price}
            </span>
          </div>
          <p className="text-sm text-[var(--jm-text-dim)] mt-1">
            {LISTING_CATEGORIES.find((c) => c.value === listing.category)?.label}
            {listing.distanceKm !== null && listing.distanceKm !== undefined
              ? ` · ${listing.distanceKm} km away`
              : ""}
          </p>

          {listing.description && <p className="text-sm mt-4">{listing.description}</p>}

          {listing.audio?.length > 0 && (
            <div className="mt-5">
              <h3 className="text-xs font-semibold text-[var(--jm-text-dim)] mb-2">
                Listen
              </h3>
              <div className="space-y-2">
                {listing.audio.map((a, i) => (
                  <div key={i}>
                    <p className="text-xs text-[var(--jm-text-dim)] mb-1">{a.title}</p>
                    <audio controls src={mediaUrl({ url: a.url })} className="w-full" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate(`/profile/${listing.seller.id}`)}
            className="flex items-center gap-2 mt-5 hover:text-[var(--jm-jam)]"
          >
            <Avatar
              media={listing.seller.media}
              profilePhotoId={listing.seller.profilePhotoId}
              name={listing.seller.name}
              size={32}
            />
            <div className="text-left">
              <p className="text-sm font-semibold">{listing.seller.name}</p>
              {listing.seller.city && (
                <p className="text-xs text-[var(--jm-text-dim)]">{listing.seller.city}</p>
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/messages?to=${listing.seller.id}`)}
            className="btn-message w-full mt-4 py-3"
          >
            Message seller
          </button>
        </div>
      </div>
    </div>
  );
}
