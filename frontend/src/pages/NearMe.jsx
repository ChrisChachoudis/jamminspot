import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import PlaceAutocomplete from "../components/PlaceAutocomplete.jsx";
import { searchCountries, searchCities } from "../api/geocoding.js";
import { coverPhotoUrl } from "../utils/media.js";

// Facebook-Marketplace-style radius picker — a plain km list, not tied to
// the backend's same_city/nearby/... distance bands (those describe a
// compatibility score, this is a literal search radius).
const RADIUS_OPTIONS_KM = [5, 10, 25, 50, 100, 250, 500];

export default function NearMe() {
  const [countryInput, setCountryInput] = useState("");
  const [country, setCountry] = useState(null);
  const [cityInput, setCityInput] = useState("");
  const [city, setCity] = useState(null);
  const [radiusKm, setRadiusKm] = useState(50);
  const [results, setResults] = useState(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [jamToast, setJamToast] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

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

  async function search() {
    if (!city) return;
    setError("");
    setLoading(true);
    setResults(null);
    try {
      const { data } = await api.get("/discover/near-me", {
        params: {
          latitude: city.latitude,
          longitude: city.longitude,
          maxDistanceKm: radiusKm,
        },
      });
      setResults(data.results);
      setIndex(0);
    } catch (err) {
      setError(err.response?.data?.error || "Could not search that area");
    } finally {
      setLoading(false);
    }
  }

  function changeArea() {
    setResults(null);
    setIndex(0);
  }

  const current = results?.[index];

  async function swipe(action) {
    if (!current) return;
    const { data } = await api.post("/discover/swipe", {
      targetUserId: current.profile.id,
      action,
    });
    if (data.jamCreated) {
      setJamToast(current.profile.name);
      setTimeout(() => setJamToast(null), 2500);
    }
    setIndex((i) => i + 1);
  }

  function messageCurrent() {
    if (!user?.premium) {
      alert(
        "Only Premium members can message musicians they haven't Jammed with yet. Jam them first, or upgrade to Premium."
      );
      return;
    }
    navigate(`/messages?to=${current.profile.id}`);
  }

  async function rewind() {
    try {
      await api.post("/discover/rewind");
      setIndex((i) => Math.max(0, i - 1));
    } catch (err) {
      alert(err.response?.data?.error || "Rewind unavailable");
    }
  }

  // Search form — shown before results, and reachable again via "Change area".
  if (results === null) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-xl font-bold mb-1">Near Me</h1>
        <p className="text-sm text-[var(--jm-text-dim)] mb-4">
          Pick any city or village and a radius to see musicians in that area — not just your own
          saved location.
        </p>

        <div className="bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-xl p-4">
          <label className="text-sm font-semibold text-[var(--jm-text-dim)] block mb-1">
            Country
          </label>
          <PlaceAutocomplete
            value={countryInput}
            onChange={setCountryInput}
            onSelect={selectCountry}
            search={searchCountries}
            getLabel={(o) => o.name}
            placeholder="e.g. Greece"
          />

          <label className="text-sm font-semibold text-[var(--jm-text-dim)] block mb-1 mt-4">
            City / village
          </label>
          <PlaceAutocomplete
            value={cityInput}
            onChange={setCityInput}
            onSelect={selectCity}
            search={(q) => searchCities(q, country?.countryCode)}
            getLabel={(o) => `${o.name}${o.state ? ` — ${o.state}` : ""}`}
            placeholder={country ? "e.g. a city or village" : "Pick a country first"}
            disabled={!country}
          />

          <label className="text-sm font-semibold text-[var(--jm-text-dim)] block mb-1 mt-4">
            Distance
          </label>
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--jm-jam)]"
          >
            {RADIUS_OPTIONS_KM.map((km) => (
              <option key={km} value={km}>
                Within {km} km
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={search}
            disabled={!city || loading}
            className="btn-jam w-full mt-4 !mt-4 disabled:opacity-40"
          >
            {loading ? "Searching…" : "Submit"}
          </button>

          {error && <p className="form-error mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  // Results — same Tinder-style card deck as Discover, just scoped to the
  // chosen area instead of the viewer's own saved location.
  return (
    <div className="flex flex-col items-center py-8 px-4">
      {jamToast && (
        <div className="fixed top-20 bg-[var(--jm-jam)] text-white px-5 py-2 rounded-full text-sm font-semibold shadow-lg z-50">
          It's a Jam with {jamToast}! 🎸
        </div>
      )}

      <button
        onClick={changeArea}
        className="text-sm text-[var(--jm-text-dim)] hover:text-[var(--jm-jam)] mb-4 self-center"
      >
        ← Change area
      </button>

      {!current ? (
        <div className="p-10 text-center text-[var(--jm-text-dim)]">
          <p className="mb-4">
            No more musicians within {radiusKm} km of {city?.name}.
          </p>
          <button onClick={changeArea} className="btn-jam !mt-0 px-6">
            Search another area
          </button>
        </div>
      ) : (
        <>
          {(() => {
            const { profile, compatibility, distanceKm } = current;
            const photo = coverPhotoUrl(profile.media, profile.profilePhotoId);
            return (
              <div className="w-full max-w-sm bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-2xl overflow-hidden">
                <button
                  onClick={() => navigate(`/profile/${profile.id}`)}
                  className="w-full h-80 bg-[var(--jm-surface-2)] flex items-center justify-center text-5xl"
                >
                  {photo ? (
                    <img src={photo} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    "🎵"
                  )}
                </button>

                <div className="p-5">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold">{profile.name || "Musician"}</h2>
                      {profile.trackCount > 0 && (
                        <Link
                          to={`/discography/${profile.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex flex-col items-center text-[9px] text-[var(--jm-text-dim)] hover:text-[var(--jm-jam)]"
                          title="View discography"
                        >
                          <span className="text-base leading-none">💽</span>
                          Discography
                        </Link>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-[var(--jm-jam)]">
                      {distanceKm} km away
                    </span>
                  </div>
                  {profile.city && <p className="text-sm text-[var(--jm-text-dim)]">{profile.city}</p>}

                  {profile.bio && <p className="text-sm mt-3">{profile.bio}</p>}

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {profile.specialties?.map((s) => (
                      <span
                        key={s}
                        className="text-xs px-2 py-1 rounded-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)]"
                      >
                        {s}
                      </span>
                    ))}
                    {profile.genres?.slice(0, 5).map((g) => (
                      <span
                        key={g}
                        className="text-xs px-2 py-1 rounded-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)]"
                      >
                        {g}
                      </span>
                    ))}
                  </div>

                  {compatibility?.reasons?.some((r) => r.type === "shared_genres") && (
                    <p className="text-xs text-[var(--jm-text-dim)] mt-3">
                      ✨ Why you might Jam:{" "}
                      {compatibility.reasons
                        .filter((r) => r.type === "shared_genres")
                        .map((r) => r.value.join(", "))
                        .join(", ")}{" "}
                      in common
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="flex items-center gap-3 mt-6">
            <button onClick={rewind} className="btn-rewind w-11 h-11 text-lg" title="Rewind">
              ↺
            </button>
            <button onClick={() => swipe("skip")} className="btn-skip w-12 h-12 text-xl" title="Skip">
              ✕
            </button>
            <button
              onClick={messageCurrent}
              className="btn-message w-11 h-11 text-lg"
              title={user?.premium ? "Message" : "Message (Premium required)"}
            >
              💬
            </button>
            <button
              onClick={() => swipe("jam")}
              className="btn-jam !mt-0 px-6 py-3 text-base"
              title="Jam"
            >
              Jam
            </button>
          </div>
        </>
      )}
    </div>
  );
}
