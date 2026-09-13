import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client.js";
import { mediaUrl } from "../utils/media.js";
import { LISTING_CATEGORIES } from "../constants.js";

export default function Seller() {
  const { id } = useParams();
  const [name, setName] = useState("");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([api.get(`/users/${id}`), api.get(`/listings/user/${id}`)])
      .then(([userRes, listingsRes]) => {
        setName(userRes.data.user.name);
        setListings(listingsRes.data.listings);
      })
      .catch((err) => setError(err.response?.data?.error || "Could not load listings"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-10 text-center text-[var(--jm-text-dim)]">Loading…</div>;
  if (error) return <div className="p-10 text-center text-[var(--jm-skip)]">{error}</div>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-sm text-[var(--jm-text-dim)] mb-4"
      >
        ← Back
      </button>

      <h1 className="text-xl font-bold mb-1">🛒 {name}'s listings</h1>
      <p className="text-sm text-[var(--jm-text-dim)] mb-6">
        {listings.length} item{listings.length === 1 ? "" : "s"} for sale
      </p>

      {!listings.length && (
        <p className="text-sm text-[var(--jm-text-dim)]">No listings right now.</p>
      )}

      <div className="space-y-4">
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-xl overflow-hidden"
          >
            <div className="flex gap-4 p-4">
              <img
                src={mediaUrl({ url: listing.photos[0] })}
                alt={listing.title}
                className="w-20 h-20 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold truncate">{listing.title}</h3>
                  <span className="text-sm font-semibold text-[var(--jm-jam)] shrink-0">
                    €{listing.price}
                  </span>
                </div>
                <p className="text-xs text-[var(--jm-text-dim)] mt-0.5">
                  {LISTING_CATEGORIES.find((c) => c.value === listing.category)?.label}
                </p>
                {listing.description && (
                  <p className="text-sm mt-2 text-[var(--jm-text-dim)]">{listing.description}</p>
                )}
              </div>
            </div>

            {listing.audio?.length > 0 && (
              <div className="px-4 pb-4 space-y-2">
                {listing.audio.map((a, i) => (
                  <div key={i}>
                    <p className="text-xs text-[var(--jm-text-dim)] mb-1">{a.title}</p>
                    <audio controls src={mediaUrl({ url: a.url })} className="w-full" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
