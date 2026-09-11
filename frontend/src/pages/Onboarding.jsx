import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { MEDIA_BASE_URL } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import ChipSelect from "../components/ChipSelect.jsx";
import PlaceAutocomplete from "../components/PlaceAutocomplete.jsx";
import { searchCountries, searchCities } from "../api/geocoding.js";
import { SPECIALTIES, INSTRUMENTS, VOCAL_SKILLS, GOALS, GENRES } from "../constants.js";

const STEPS = ["location", "specialty", "goals", "genres", "bio", "gallery"];

function toggle(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [countryInput, setCountryInput] = useState("");
  const [country, setCountry] = useState(null);
  const [cityInput, setCityInput] = useState("");
  const [city, setCity] = useState(null);
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [specialties, setSpecialties] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [vocalSkills, setVocalSkills] = useState([]);
  const [goals, setGoals] = useState([]);
  const [genres, setGenres] = useState([]);
  const [bio, setBio] = useState("");
  const [bioLoading, setBioLoading] = useState(false);
  const [bioError, setBioError] = useState("");
  const [media, setMedia] = useState([]);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const isInstrumentalist = specialties.includes("instrumentalist");
  const isVocalist = specialties.includes("vocalist");

  function canContinue() {
    if (STEPS[step] === "location") return Boolean(city);
    if (STEPS[step] === "specialty") {
      if (!specialties.length) return false;
      if (isInstrumentalist && !instruments.length) return false;
      if (isVocalist && !vocalSkills.length) return false;
      return true;
    }
    if (STEPS[step] === "goals") return goals.length > 0;
    if (STEPS[step] === "genres") return genres.length > 0;
    return true;
  }

  function selectCountry(option) {
    setCountry(option);
    setCountryInput(option.name);
    setCity(null);
    setCityInput("");
  }

  async function selectCity(option) {
    setCity(option);
    setCityInput(option.name);
    setLocationError("");
    setLocationSaving(true);
    try {
      await api.patch("/users/me/location", {
        longitude: option.longitude,
        latitude: option.latitude,
        city: option.name,
        country: country?.name || option.country,
      });
    } catch (err) {
      setLocationError(err.response?.data?.error || "Could not save your location");
    } finally {
      setLocationSaving(false);
    }
  }

  async function uploadFiles(fileList) {
    setMediaError("");
    setMediaUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const formData = new FormData();
        formData.append("file", file);
        const { data } = await api.post("/users/me/media", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setMedia(data.media);
      }
    } catch (err) {
      setMediaError(err.response?.data?.error || "Could not upload — try a smaller file");
    } finally {
      setMediaUploading(false);
    }
  }

  async function removeMedia(mediaId) {
    setMediaError("");
    try {
      const { data } = await api.delete(`/users/me/media/${mediaId}`);
      setMedia(data.media);
    } catch (err) {
      setMediaError(err.response?.data?.error || "Could not remove file");
    }
  }

  async function generateBio() {
    setBioError("");
    setBioLoading(true);
    try {
      const { data } = await api.post("/ai/bio", { freeText: bio });
      setBio(data.bio);
    } catch (err) {
      setBioError(err.response?.data?.error || "Could not generate a bio right now");
    } finally {
      setBioLoading(false);
    }
  }

  async function finish() {
    setError("");
    setSubmitting(true);
    try {
      await api.patch("/users/me/onboarding", {
        specialties,
        instruments,
        vocalSkills,
        goals,
        genres,
        bio: bio || undefined,
      });
      await refreshUser();
      navigate("/discover");
    } catch (err) {
      setError(err.response?.data?.error || "Could not save your profile");
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    if (step === STEPS.length - 1) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="flex gap-1 mb-8">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${
              i <= step ? "bg-[var(--jm-jam)]" : "bg-[var(--jm-border)]"
            }`}
          />
        ))}
      </div>

      {STEPS[step] === "location" && (
        <section>
          <h2 className="text-xl font-semibold mb-1">Where are you?</h2>
          <p className="text-[var(--jm-text-dim)] text-sm mb-4">
            Start typing your country, then your city or village — pick it from the list.
          </p>

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
            placeholder={country ? "e.g. your city or village" : "Pick a country first"}
            disabled={!country}
          />

          {locationSaving && (
            <p className="text-sm text-[var(--jm-text-dim)] mt-2">Saving…</p>
          )}
          {locationError && <p className="form-error mt-2">{locationError}</p>}
          {city && !locationSaving && !locationError && (
            <p className="text-sm text-[var(--jm-jam)] mt-3">
              ✓ {city.name}, {country?.name}
            </p>
          )}
        </section>
      )}

      {STEPS[step] === "specialty" && (
        <section>
          <h2 className="text-xl font-semibold mb-1">What are you?</h2>
          <p className="text-[var(--jm-text-dim)] text-sm mb-4">Pick everything that applies.</p>
          <ChipSelect
            options={SPECIALTIES}
            selected={specialties}
            onToggle={(v) => setSpecialties((s) => toggle(s, v))}
          />

          {isInstrumentalist && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-[var(--jm-text-dim)] mb-2">
                Which instruments?
              </h3>
              <ChipSelect
                options={INSTRUMENTS}
                selected={instruments}
                onToggle={(v) => setInstruments((s) => toggle(s, v))}
              />
            </div>
          )}

          {isVocalist && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-[var(--jm-text-dim)] mb-2">
                Vocal skills?
              </h3>
              <ChipSelect
                options={VOCAL_SKILLS}
                selected={vocalSkills}
                onToggle={(v) => setVocalSkills((s) => toggle(s, v))}
              />
            </div>
          )}
        </section>
      )}

      {STEPS[step] === "goals" && (
        <section>
          <h2 className="text-xl font-semibold mb-1">What are you looking for?</h2>
          <p className="text-[var(--jm-text-dim)] text-sm mb-4">Pick at least one goal.</p>
          <ChipSelect options={GOALS} selected={goals} onToggle={(v) => setGoals((s) => toggle(s, v))} />
        </section>
      )}

      {STEPS[step] === "genres" && (
        <section>
          <h2 className="text-xl font-semibold mb-1">Your genres</h2>
          <p className="text-[var(--jm-text-dim)] text-sm mb-4">Pick at least one genre.</p>
          <ChipSelect
            options={GENRES}
            selected={genres}
            onToggle={(v) => setGenres((s) => toggle(s, v))}
          />
        </section>
      )}

      {STEPS[step] === "bio" && (
        <section>
          <h2 className="text-xl font-semibold mb-1">Your bio</h2>
          <p className="text-[var(--jm-text-dim)] text-sm mb-4">
            Tell us about yourself in a sentence or two and let AI write your bio — or skip and
            write your own later.
          </p>

          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="e.g. Παίζω κιθάρα 8 χρόνια, κυρίως alternative και metal, ψάχνω κόσμο για original band."
            rows={4}
            className="w-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)] rounded-xl p-3 text-sm outline-none focus:border-[var(--jm-jam)]"
          />

          <button
            type="button"
            onClick={generateBio}
            disabled={!bio.trim() || bioLoading}
            className="mt-3 px-4 py-2 rounded-full text-sm font-semibold bg-[var(--jm-surface-2)] border border-[var(--jm-jam)] text-[var(--jm-jam)] disabled:opacity-40"
          >
            {bioLoading ? "Writing…" : "✨ Generate bio with AI"}
          </button>

          {bioError && <p className="form-error mt-2">{bioError}</p>}
        </section>
      )}

      {STEPS[step] === "gallery" && (
        <section>
          <h2 className="text-xl font-semibold mb-1">Add media</h2>
          <p className="text-[var(--jm-text-dim)] text-sm mb-4">
            Add photos, videos or demo tracks — this step is optional, you can always add more
            later from your profile.
          </p>

          <label className="block border border-dashed border-[var(--jm-border)] rounded-xl p-10 text-center text-[var(--jm-text-dim)] text-sm cursor-pointer hover:border-[var(--jm-jam)]">
            {mediaUploading ? "Uploading…" : "Click to choose photos, videos or audio"}
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

          {mediaError && <p className="form-error mt-2">{mediaError}</p>}

          {media.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {media.map((item) => (
                <div
                  key={item._id}
                  className="relative aspect-square bg-[var(--jm-surface-2)] rounded-lg overflow-hidden border border-[var(--jm-border)]"
                >
                  {item.type === "image" && (
                    <img
                      src={`${MEDIA_BASE_URL}${item.url}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                  {item.type === "video" && (
                    <video src={`${MEDIA_BASE_URL}${item.url}`} className="w-full h-full object-cover" />
                  )}
                  {item.type === "audio" && (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🎵</div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(item._id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs leading-6"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {error && <p className="form-error mt-4">{error}</p>}

      <div className="flex justify-between mt-8">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
          className="text-sm text-[var(--jm-text-dim)] disabled:opacity-30"
        >
          Back
        </button>
        <button
          type="button"
          onClick={next}
          disabled={!canContinue() || submitting}
          className="btn-jam px-8 !mt-0"
        >
          {step === STEPS.length - 1 ? (submitting ? "Saving…" : "Finish") : "Continue"}
        </button>
      </div>
    </div>
  );
}
