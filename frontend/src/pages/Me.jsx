import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { coverPhotoUrl, mediaUrl } from "../utils/media.js";
import UploadReleaseModal from "../components/UploadReleaseModal.jsx";
import ChipSelect from "../components/ChipSelect.jsx";
import PlaceAutocomplete from "../components/PlaceAutocomplete.jsx";
import { searchCountries, searchCities } from "../api/geocoding.js";
import { SPECIALTIES, INSTRUMENTS, VOCAL_SKILLS, GOALS, GENRES } from "../constants.js";

function toggle(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function Me() {
  const { user, refreshUser } = useAuth();
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [settingPhotoId, setSettingPhotoId] = useState(null);
  const [releases, setReleases] = useState([]);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [releaseError, setReleaseError] = useState("");

  const [countryInput, setCountryInput] = useState("");
  const [country, setCountry] = useState(null);
  const [cityInput, setCityInput] = useState("");
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [editSpecialties, setEditSpecialties] = useState([]);
  const [editInstruments, setEditInstruments] = useState([]);
  const [editVocalSkills, setEditVocalSkills] = useState([]);
  const [editGoals, setEditGoals] = useState([]);
  const [editGenres, setEditGenres] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    if (!user) return;
    api.get(`/users/${user.id}/releases`).then(({ data }) => setReleases(data.releases));
  }, [user?.id]);

  // Seed the editable-settings form once per logged-in user, not on every
  // refreshUser() (e.g. after a media upload), so in-progress edits survive.
  useEffect(() => {
    if (!user) return;
    setEditSpecialties(user.specialties || []);
    setEditInstruments(user.instruments || []);
    setEditVocalSkills(user.vocalSkills || []);
    setEditGoals(user.goals || []);
    setEditGenres(user.genres || []);
    setCityInput(user.city || "");
  }, [user?.id]);

  if (!user) return null;

  const trackCount = releases.reduce((sum, r) => sum + r.tracks.length, 0);

  async function removeRelease(releaseId) {
    setReleaseError("");
    try {
      const { data } = await api.delete(`/users/me/releases/${releaseId}`);
      setReleases(data.releases);
    } catch (err) {
      setReleaseError(err.response?.data?.error || "Could not remove release");
    }
  }

  const photo = coverPhotoUrl(user.media, user.profilePhotoId);

  async function uploadFiles(fileList) {
    setMediaError("");
    setMediaUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const formData = new FormData();
        formData.append("file", file);
        await api.post("/users/me/media", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      await refreshUser();
    } catch (err) {
      setMediaError(err.response?.data?.error || "Could not upload — try a smaller file");
    } finally {
      setMediaUploading(false);
    }
  }

  async function removeMedia(mediaId) {
    setMediaError("");
    try {
      await api.delete(`/users/me/media/${mediaId}`);
      await refreshUser();
    } catch (err) {
      setMediaError(err.response?.data?.error || "Could not remove file");
    }
  }

  async function setProfilePhoto(mediaId) {
    setMediaError("");
    setSettingPhotoId(mediaId);
    try {
      await api.patch("/users/me/profile-photo", { mediaId });
      await refreshUser();
    } catch (err) {
      setMediaError(err.response?.data?.error || "Could not set profile photo");
    } finally {
      setSettingPhotoId(null);
    }
  }

  function selectCountry(option) {
    setCountry(option);
    setCountryInput(option.name);
    setCityInput("");
  }

  async function selectCity(option) {
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
      await refreshUser();
    } catch (err) {
      setLocationError(err.response?.data?.error || "Could not save your location");
    } finally {
      setLocationSaving(false);
    }
  }

  async function saveProfileSettings() {
    setProfileError("");
    setProfileSaved(false);
    setSavingProfile(true);
    try {
      await api.patch("/users/me/onboarding", {
        specialties: editSpecialties,
        instruments: editInstruments,
        vocalSkills: editVocalSkills,
        goals: editGoals,
        genres: editGenres,
      });
      await refreshUser();
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      setProfileError(err.response?.data?.error || "Could not save your changes");
    } finally {
      setSavingProfile(false);
    }
  }

  const isInstrumentalist = editSpecialties.includes("instrumentalist");
  const isVocalist = editSpecialties.includes("vocalist");

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-2xl overflow-hidden">
        <div className="h-72 bg-[var(--jm-surface-2)] flex items-center justify-center text-6xl">
          {photo ? (
            <img src={photo} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            "🎵"
          )}
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{user.name}</h1>
            {trackCount > 0 && (
              <Link
                to={`/discography/${user.id}`}
                className="flex flex-col items-center text-[10px] text-[var(--jm-text-dim)] hover:text-[var(--jm-jam)]"
                title="View discography"
              >
                <span className="text-lg leading-none">💽</span>
                Discography
              </Link>
            )}
          </div>
          {user.city && <p className="text-sm text-[var(--jm-text-dim)]">{user.city}</p>}

          {user.bio && <p className="text-sm mt-4">{user.bio}</p>}

          <div className="flex flex-wrap gap-1.5 mt-4">
            {user.specialties?.map((s) => (
              <span
                key={s}
                className="text-xs px-2 py-1 rounded-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)]"
              >
                {s}
              </span>
            ))}
            {user.instruments?.map((i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)]"
              >
                {i}
              </span>
            ))}
            {user.genres?.map((g) => (
              <span
                key={g}
                className="text-xs px-2 py-1 rounded-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)]"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold mb-1">Your photo</h2>
        <p className="text-sm text-[var(--jm-text-dim)] mb-4">
          Choose which photo you want as your profile picture.
        </p>

        <label className="block border border-dashed border-[var(--jm-border)] rounded-xl p-6 text-center text-[var(--jm-text-dim)] text-sm cursor-pointer hover:border-[var(--jm-jam)] mb-4">
          {mediaUploading ? "Uploading…" : "Click to add photos, videos or audio"}
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

        {mediaError && <p className="form-error mb-3">{mediaError}</p>}

        {user.media?.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {user.media.map((item) => {
              const isProfilePhoto = mediaUrl(item) === photo;
              return (
                <div
                  key={item._id}
                  className={`relative aspect-square bg-[var(--jm-surface-2)] rounded-lg overflow-hidden border-2 ${
                    isProfilePhoto ? "border-[var(--jm-jam)]" : "border-[var(--jm-border)]"
                  }`}
                >
                  {item.type === "image" && (
                    <img src={mediaUrl(item)} alt="" className="w-full h-full object-cover" />
                  )}
                  {item.type === "video" && (
                    <video src={mediaUrl(item)} className="w-full h-full object-cover" />
                  )}
                  {item.type === "audio" && (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🎵</div>
                  )}

                  {isProfilePhoto && (
                    <span className="absolute top-1 left-1 text-[10px] font-semibold bg-[var(--jm-jam)] text-white px-1.5 py-0.5 rounded-full">
                      Profile
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => removeMedia(item._id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs leading-6"
                  >
                    ✕
                  </button>

                  {item.type === "image" && !isProfilePhoto && (
                    <button
                      type="button"
                      onClick={() => setProfilePhoto(item._id)}
                      disabled={settingPhotoId === item._id}
                      className="absolute bottom-1 left-1 right-1 text-[10px] font-semibold bg-black/60 text-white rounded-full py-1 disabled:opacity-50"
                    >
                      {settingPhotoId === item._id ? "Setting…" : "Set as profile"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold mb-1">Your music</h2>
        <p className="text-sm text-[var(--jm-text-dim)] mb-4">
          Upload tracks (MP3 + cover art) to build your discography.
        </p>

        <button
          type="button"
          onClick={() => setReleaseModalOpen(true)}
          className="block w-full border border-dashed border-[var(--jm-border)] rounded-xl p-6 text-center text-[var(--jm-text-dim)] text-sm cursor-pointer hover:border-[var(--jm-jam)] mb-4"
        >
          Upload your music
        </button>

        {releaseError && <p className="form-error mb-3">{releaseError}</p>}

        {releases.length > 0 && (
          <div className="space-y-2">
            {releases.map((release) => (
              <div
                key={release._id}
                className="flex items-center gap-3 bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-xl p-3"
              >
                <img
                  src={mediaUrl({ url: release.coverUrl })}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{release.title}</p>
                  <p className="text-xs text-[var(--jm-text-dim)]">
                    {release.tracks.length} track{release.tracks.length === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeRelease(release._id)}
                  className="w-7 h-7 rounded-full bg-[var(--jm-surface-2)] text-xs shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold mb-1">Your info</h2>
        <p className="text-sm text-[var(--jm-text-dim)] mb-4">
          Update what you set during onboarding — location, specialties, goals and genres.
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
          placeholder={country ? "e.g. your city or village" : "Currently: " + (user.city || "not set")}
          disabled={!country}
        />
        {locationSaving && <p className="text-sm text-[var(--jm-text-dim)] mt-2">Saving…</p>}
        {locationError && <p className="form-error mt-2">{locationError}</p>}

        <h3 className="text-sm font-semibold text-[var(--jm-text-dim)] mt-6 mb-2">What are you?</h3>
        <ChipSelect
          options={SPECIALTIES}
          selected={editSpecialties}
          onToggle={(v) => setEditSpecialties((s) => toggle(s, v))}
        />

        {isInstrumentalist && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-[var(--jm-text-dim)] mb-2">Instruments</h3>
            <ChipSelect
              options={INSTRUMENTS}
              selected={editInstruments}
              onToggle={(v) => setEditInstruments((s) => toggle(s, v))}
            />
          </div>
        )}

        {isVocalist && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-[var(--jm-text-dim)] mb-2">Vocal skills</h3>
            <ChipSelect
              options={VOCAL_SKILLS}
              selected={editVocalSkills}
              onToggle={(v) => setEditVocalSkills((s) => toggle(s, v))}
            />
          </div>
        )}

        <h3 className="text-sm font-semibold text-[var(--jm-text-dim)] mt-6 mb-2">Looking for</h3>
        <ChipSelect
          options={GOALS}
          selected={editGoals}
          onToggle={(v) => setEditGoals((s) => toggle(s, v))}
        />

        <h3 className="text-sm font-semibold text-[var(--jm-text-dim)] mt-6 mb-2">Genres</h3>
        <ChipSelect
          options={GENRES}
          selected={editGenres}
          onToggle={(v) => setEditGenres((s) => toggle(s, v))}
        />

        {profileError && <p className="form-error mt-4">{profileError}</p>}

        <button
          type="button"
          onClick={saveProfileSettings}
          disabled={savingProfile}
          className="btn-jam px-8 mt-6 disabled:opacity-60"
        >
          {savingProfile ? "Saving…" : profileSaved ? "Saved ✓" : "Save changes"}
        </button>
      </div>

      {releaseModalOpen && (
        <UploadReleaseModal
          onClose={() => setReleaseModalOpen(false)}
          onUploaded={setReleases}
        />
      )}
    </div>
  );
}
