import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { coverPhotoUrl, mediaUrl } from "../utils/media.js";
import UploadReleaseModal from "../components/UploadReleaseModal.jsx";
import ChipSelect from "../components/ChipSelect.jsx";
import PlaceAutocomplete from "../components/PlaceAutocomplete.jsx";
import { searchCountries, searchCities } from "../api/geocoding.js";
import { SPECIALTIES, INSTRUMENTS, VOCAL_SKILLS, GOALS, GENRES, LISTING_CATEGORIES } from "../constants.js";

const MAX_LISTING_PHOTOS = 5;
const MAX_LISTING_AUDIO = 3;

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
  const [editingInfo, setEditingInfo] = useState(false);

  const [listings, setListings] = useState([]);
  const [sellingOpen, setSellingOpen] = useState(false);
  const [listingTitle, setListingTitle] = useState("");
  const [listingDescription, setListingDescription] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  const [listingCategory, setListingCategory] = useState(LISTING_CATEGORIES[0].value);
  const [listingPhotos, setListingPhotos] = useState([]);
  const [listingAudio, setListingAudio] = useState([]);
  const [listingSubmitting, setListingSubmitting] = useState(false);
  const [listingError, setListingError] = useState("");

  useEffect(() => {
    if (!user) return;
    api.get(`/users/${user.id}/releases`).then(({ data }) => setReleases(data.releases));
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    api.get("/listings/mine").then(({ data }) => setListings(data.listings));
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

  function addListingPhotos(fileList) {
    setListingPhotos((prev) => [...prev, ...Array.from(fileList)].slice(0, MAX_LISTING_PHOTOS));
  }

  function removeListingPhoto(index) {
    setListingPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function addListingAudio(fileList) {
    setListingAudio((prev) => [...prev, ...Array.from(fileList)].slice(0, MAX_LISTING_AUDIO));
  }

  function removeListingAudio(index) {
    setListingAudio((prev) => prev.filter((_, i) => i !== index));
  }

  async function submitListing() {
    setListingError("");
    if (!listingTitle.trim()) return setListingError("Title is required");
    if (!listingPrice || Number(listingPrice) < 0) return setListingError("Enter a valid price");
    if (!listingPhotos.length) return setListingError("Add at least one photo");

    setListingSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", listingTitle);
      formData.append("description", listingDescription);
      formData.append("price", listingPrice);
      formData.append("category", listingCategory);
      listingPhotos.forEach((file) => formData.append("photos", file));
      listingAudio.forEach((file) => formData.append("audio", file));

      const { data } = await api.post("/listings", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setListings((prev) => [data.listing, ...prev]);
      setListingTitle("");
      setListingDescription("");
      setListingPrice("");
      setListingCategory(LISTING_CATEGORIES[0].value);
      setListingPhotos([]);
      setListingAudio([]);
      setSellingOpen(false);
    } catch (err) {
      setListingError(err.response?.data?.error || "Could not post your listing");
    } finally {
      setListingSubmitting(false);
    }
  }

  async function removeListing(listingId) {
    try {
      const { data } = await api.delete(`/listings/${listingId}`);
      setListings(data.listings);
    } catch {
      // Best-effort — leave the list as-is if the delete fails.
    }
  }

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

      <div className="mt-8 bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-2xl p-5">
        <h2 className="text-lg font-bold mb-1">Your info</h2>

        {!editingInfo ? (
          <>
            <p className="text-sm text-[var(--jm-text-dim)] mb-4">
              Location, specialties, goals and genres you set during onboarding.
            </p>
            <button
              type="button"
              onClick={() => setEditingInfo(true)}
              className="btn-jam px-6 !mt-0"
            >
              Change your info
            </button>
          </>
        ) : (
          <>
        <label className="text-sm font-semibold text-[var(--jm-text-dim)] block mb-1 mt-4">
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

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={saveProfileSettings}
            disabled={savingProfile}
            className="btn-jam flex-1 !mt-0 disabled:opacity-60"
          >
            {savingProfile ? "Saving…" : profileSaved ? "Saved ✓" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => setEditingInfo(false)}
            className="px-6 rounded-full text-sm font-semibold bg-[var(--jm-surface-2)] text-[var(--jm-text-dim)] hover:text-[var(--jm-text)]"
          >
            Done
          </button>
        </div>
          </>
        )}
      </div>

      <div className="mt-8 bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-2xl p-5">
        <h2 className="text-lg font-bold mb-1">Sell something</h2>

        {!sellingOpen ? (
          <>
            <p className="text-sm text-[var(--jm-text-dim)] mb-4">
              List an instrument, gear, a service or anything else for other musicians to see.
            </p>
            <button
              type="button"
              onClick={() => setSellingOpen(true)}
              className="btn-jam px-6 !mt-0"
            >
              Post a listing
            </button>
          </>
        ) : (
          <>
            <label className="text-sm font-semibold text-[var(--jm-text-dim)] block mb-1 mt-4">
              Title
            </label>
            <input
              value={listingTitle}
              onChange={(e) => setListingTitle(e.target.value)}
              placeholder="e.g. Fender Stratocaster, mint condition"
              className="w-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--jm-jam)]"
            />

            <label className="text-sm font-semibold text-[var(--jm-text-dim)] block mb-1 mt-4">
              Description
            </label>
            <textarea
              value={listingDescription}
              onChange={(e) => setListingDescription(e.target.value)}
              rows={3}
              placeholder="Condition, details, anything a buyer should know"
              className="w-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)] rounded-xl p-3 text-sm outline-none focus:border-[var(--jm-jam)]"
            />

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label className="text-sm font-semibold text-[var(--jm-text-dim)] block mb-1">
                  Price (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={listingPrice}
                  onChange={(e) => setListingPrice(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--jm-jam)]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[var(--jm-text-dim)] block mb-1">
                  Category
                </label>
                <select
                  value={listingCategory}
                  onChange={(e) => setListingCategory(e.target.value)}
                  className="w-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--jm-jam)]"
                >
                  {LISTING_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="text-sm font-semibold text-[var(--jm-text-dim)] block mb-1 mt-4">
              Photos (up to {MAX_LISTING_PHOTOS})
            </label>
            <label className="block border border-dashed border-[var(--jm-border)] rounded-xl p-6 text-center text-[var(--jm-text-dim)] text-sm cursor-pointer hover:border-[var(--jm-jam)]">
              {listingPhotos.length >= MAX_LISTING_PHOTOS
                ? "Maximum photos added"
                : "Click to add photos"}
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={listingPhotos.length >= MAX_LISTING_PHOTOS}
                onChange={(e) => {
                  if (e.target.files?.length) addListingPhotos(e.target.files);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </label>

            {listingPhotos.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {listingPhotos.map((file, i) => (
                  <div
                    key={i}
                    className="relative aspect-square bg-[var(--jm-surface-2)] rounded-lg overflow-hidden border border-[var(--jm-border)]"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeListingPhoto(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] leading-5"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="text-sm font-semibold text-[var(--jm-text-dim)] block mb-1 mt-4">
              Audio preview (optional, up to {MAX_LISTING_AUDIO} MP3s)
            </label>
            <p className="text-xs text-[var(--jm-text-dim)] mb-2">
              Let a buyer hear it first — a beat for sale, or a demo of how an instrument, mix or
              production sounds.
            </p>
            <label className="block border border-dashed border-[var(--jm-border)] rounded-xl p-6 text-center text-[var(--jm-text-dim)] text-sm cursor-pointer hover:border-[var(--jm-jam)]">
              {listingAudio.length >= MAX_LISTING_AUDIO ? "Maximum audio added" : "Click to add MP3s"}
              <input
                type="file"
                accept="audio/mpeg,.mp3"
                multiple
                disabled={listingAudio.length >= MAX_LISTING_AUDIO}
                onChange={(e) => {
                  if (e.target.files?.length) addListingAudio(e.target.files);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </label>

            {listingAudio.length > 0 && (
              <div className="space-y-2 mt-3">
                {listingAudio.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-[var(--jm-surface-2)] border border-[var(--jm-border)] rounded-xl p-2"
                  >
                    <span className="text-base shrink-0">🎵</span>
                    <span className="flex-1 truncate text-sm">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeListingAudio(i)}
                      className="w-5 h-5 rounded-full bg-black/30 text-xs leading-5 shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {listingError && <p className="form-error mt-3">{listingError}</p>}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={submitListing}
                disabled={listingSubmitting}
                className="btn-jam flex-1 !mt-0 disabled:opacity-60"
              >
                {listingSubmitting ? "Posting…" : "Post listing"}
              </button>
              <button
                type="button"
                onClick={() => setSellingOpen(false)}
                className="px-6 rounded-full text-sm font-semibold bg-[var(--jm-surface-2)] text-[var(--jm-text-dim)] hover:text-[var(--jm-text)]"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {listings.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-semibold text-[var(--jm-text-dim)] mb-2">Your listings</h3>
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-[var(--jm-surface-2)] border border-[var(--jm-border)] rounded-xl p-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={mediaUrl({ url: listing.photos[0] })}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{listing.title}</p>
                    <p className="text-xs text-[var(--jm-text-dim)]">
                      €{listing.price} ·{" "}
                      {LISTING_CATEGORIES.find((c) => c.value === listing.category)?.label}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeListing(listing.id)}
                    className="w-7 h-7 rounded-full bg-[var(--jm-surface)] text-xs shrink-0"
                  >
                    ✕
                  </button>
                </div>

                {listing.audio?.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {listing.audio.map((a, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-[var(--jm-text-dim)] w-20 truncate shrink-0">
                          {a.title}
                        </span>
                        <audio controls src={mediaUrl({ url: a.url })} className="flex-1 h-8" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
