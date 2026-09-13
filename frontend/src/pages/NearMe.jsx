import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import Avatar from "../components/Avatar.jsx";
import PlaceAutocomplete from "../components/PlaceAutocomplete.jsx";
import { searchCountries, searchCities } from "../api/geocoding.js";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
    } catch (err) {
      setError(err.response?.data?.error || "Could not search that area");
    } finally {
      setLoading(false);
    }
  }

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

      {results !== null && (
        <div className="mt-6">
          {results.length === 0 ? (
            <p className="text-sm text-[var(--jm-text-dim)] text-center">
              No musicians found within {radiusKm} km of {city?.name}.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map(({ profile, distanceKm }) => (
                <div
                  key={profile.id}
                  onClick={() => navigate(`/profile/${profile.id}`)}
                  className="cursor-pointer bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-xl p-4 hover:border-[var(--jm-jam)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      media={profile.media}
                      profilePhotoId={profile.profilePhotoId}
                      name={profile.name}
                      size={44}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold truncate">{profile.name || "Musician"}</span>
                        <span className="text-xs font-semibold text-[var(--jm-jam)] shrink-0 ml-2">
                          {distanceKm} km
                        </span>
                      </div>
                      <p className="text-xs text-[var(--jm-text-dim)] truncate">
                        {profile.city || (profile.specialties || []).join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
