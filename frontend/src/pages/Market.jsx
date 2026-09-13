import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import Avatar from "../components/Avatar.jsx";
import PlaceAutocomplete from "../components/PlaceAutocomplete.jsx";
import { searchCountries, searchCities } from "../api/geocoding.js";
import { LISTING_CATEGORIES } from "../constants.js";
import { mediaUrl } from "../utils/media.js";

const RADIUS_OPTIONS_KM = [5, 10, 25, 50, 100, 250, 500];
const PAGE_SIZE = 12;

export default function Market() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [countryInput, setCountryInput] = useState("");
  const [country, setCountry] = useState(null);
  const [cityInput, setCityInput] = useState("");
  const [city, setCity] = useState(null);
  const [radiusKm, setRadiusKm] = useState(50);

  const navigate = useNavigate();

  async function loadListings() {
    setLoading(true);
    setPage(1);
    try {
      const params = {};
      if (category) params.category = category;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (city) {
        params.latitude = city.latitude;
        params.longitude = city.longitude;
        params.maxDistanceKm = radiusKm;
      }
      const { data } = await api.get("/listings", { params });
      setListings(data.listings);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectCountry(option) {
    setCountry(option);
    setCountryInput(option.name);
    setCity(null);
    setCityInput("");
  }

  function selectCity(option) {
    setCity(option);
    setCityInput(option.name);
  }

  function clearFilters() {
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setCountry(null);
    setCountryInput("");
    setCity(null);
    setCityInput("");
    setRadiusKm(50);
    setLoading(true);
    setPage(1);
    api.get("/listings").then(({ data }) => {
      setListings(data.listings);
      setLoading(false);
    });
  }

  const totalPages = Math.max(1, Math.ceil(listings.length / PAGE_SIZE));
  const pageListings = listings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-1">Market</h1>
      <p className="text-sm text-[var(--jm-text-dim)] mb-4">
        Instruments, gear, services and more from other musicians.
      </p>

      <div className="bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-xl p-4 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold text-[var(--jm-text-dim)] block mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--jm-jam)]"
            >
              <option value="">Any category</option>
              {LISTING_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--jm-text-dim)] block mb-1">
              Min price (€)
            </label>
            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              className="w-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--jm-jam)]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--jm-text-dim)] block mb-1">
              Max price (€)
            </label>
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Any"
              className="w-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--jm-jam)]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--jm-text-dim)] block mb-1">
              Radius
            </label>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              disabled={!city}
              className="w-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--jm-jam)] disabled:opacity-40"
            >
              {RADIUS_OPTIONS_KM.map((km) => (
                <option key={km} value={km}>
                  Within {km} km
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="text-xs font-semibold text-[var(--jm-text-dim)] block mb-1">
              Country
            </label>
            <PlaceAutocomplete
              value={countryInput}
              onChange={setCountryInput}
              onSelect={selectCountry}
              search={searchCountries}
              getLabel={(o) => o.name}
              placeholder="Any country"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--jm-text-dim)] block mb-1">
              City / village
            </label>
            <PlaceAutocomplete
              value={cityInput}
              onChange={setCityInput}
              onSelect={selectCity}
              search={(q) => searchCities(q, country?.countryCode)}
              getLabel={(o) => `${o.name}${o.state ? ` — ${o.state}` : ""}`}
              placeholder={country ? "Any city" : "Pick a country first"}
              disabled={!country}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button type="button" onClick={loadListings} className="btn-jam px-6 !mt-0">
            Apply filters
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="px-6 rounded-full text-sm font-semibold bg-[var(--jm-surface-2)] text-[var(--jm-text-dim)] hover:text-[var(--jm-text)]"
          >
            Clear
          </button>
        </div>
      </div>

      {!loading && listings.length > 0 && !category && !minPrice && !maxPrice && !city && (
        <p className="text-xs text-[var(--jm-text-dim)] mb-3">
          Showing the 10 most recent listings — apply a filter to see more.
        </p>
      )}

      {loading ? (
        <div className="p-10 text-center text-[var(--jm-text-dim)]">Loading listings…</div>
      ) : listings.length === 0 ? (
        <div className="p-10 text-center text-[var(--jm-text-dim)]">
          No listings match these filters yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {pageListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/profile/${listing.seller.id}`)}
                  className="w-full h-20 bg-[var(--jm-surface-2)] block"
                >
                  <img
                    src={mediaUrl({ url: listing.photos[0] })}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </button>

                <div className="p-2">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs font-semibold truncate">{listing.title}</p>
                    <span className="text-xs font-semibold text-[var(--jm-jam)] shrink-0">
                      €{listing.price}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--jm-text-dim)] truncate">
                    {LISTING_CATEGORIES.find((c) => c.value === listing.category)?.label}
                    {listing.distanceKm !== null && ` · ${listing.distanceKm} km`}
                  </p>

                  {listing.audio?.length > 0 && (
                    <audio
                      controls
                      src={mediaUrl({ url: listing.audio[0].url })}
                      className="w-full h-7 mt-1.5"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${listing.seller.id}`)}
                    className="flex items-center gap-1.5 mt-1.5 hover:text-[var(--jm-jam)]"
                  >
                    <Avatar
                      media={listing.seller.media}
                      profilePhotoId={listing.seller.profilePhotoId}
                      name={listing.seller.name}
                      size={16}
                    />
                    <span className="text-[10px] text-[var(--jm-text-dim)] truncate">
                      {listing.seller.name}
                      {listing.seller.city ? ` · ${listing.seller.city}` : ""}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-6">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-full text-sm bg-[var(--jm-surface-2)] text-[var(--jm-text-dim)] disabled:opacity-30"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-full text-sm font-semibold ${
                    p === page
                      ? "bg-[var(--jm-jam)] text-white"
                      : "bg-[var(--jm-surface-2)] text-[var(--jm-text-dim)] hover:text-[var(--jm-text)]"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-full text-sm bg-[var(--jm-surface-2)] text-[var(--jm-text-dim)] disabled:opacity-30"
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
