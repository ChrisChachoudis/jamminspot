import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "../components/Avatar.jsx";

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [blocked, setBlocked] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [donationUrl, setDonationUrl] = useState("");
  const [donationMsg, setDonationMsg] = useState("");
  const [donationSaving, setDonationSaving] = useState(false);

  useEffect(() => {
    setDonationUrl(user?.donationUrl || "");
  }, [user?.donationUrl]);

  async function saveDonation() {
    setDonationMsg("");
    setDonationSaving(true);
    try {
      const { data } = await api.patch("/users/me/donation", { url: donationUrl });
      setDonationUrl(data.donationUrl || "");
      await refreshUser();
      setDonationMsg(data.donationUrl ? "Saved — the donate button now shows on your profile." : "Donate button removed.");
    } catch (err) {
      setDonationMsg(err.response?.data?.error || "Could not save the link");
    } finally {
      setDonationSaving(false);
    }
  }

  useEffect(() => {
    api.get("/users/me/blocked").then(({ data }) => setBlocked(data.blocked));
  }, []);

  async function unblock(id) {
    await api.delete(`/users/${id}/block`);
    setBlocked((b) => b.filter((u) => u.id !== id));
  }

  async function downloadData() {
    const { data } = await api.get("/users/me/export");
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "jamminspot-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAccount() {
    setError("");
    setDeleting(true);
    try {
      await api.delete("/users/me", { data: { password } });
      logout();
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Could not delete the account");
    } finally {
      setDeleting(false);
    }
  }

  const card = "bg-[var(--jm-surface)] border border-[var(--jm-border)] rounded-xl p-4 mb-4";

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Settings</h1>

      <div className={card}>
        <h2 className="font-semibold mb-1">Donations</h2>
        <p className="text-sm text-[var(--jm-text-dim)] mb-3">
          Let other musicians support you. Paste your own link (PayPal.me, Revolut.me, Ko-fi, Buy
          Me a Coffee, Patreon, Liberapay, Venmo, Cash App or GitHub Sponsors) and the{" "}
          <span className="font-semibold text-[var(--jm-rewind)]">$ donate</span> button on your
          profile will lead people to it. Money goes straight to you — Jamminspot never handles
          it. Until you add a link, the button tells visitors you haven't set up donations yet.
        </p>
        <input
          type="url"
          value={donationUrl}
          onChange={(e) => setDonationUrl(e.target.value)}
          placeholder="https://paypal.me/yourname"
          className="w-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--jm-jam)]"
        />
        {donationMsg && <p className="text-xs text-[var(--jm-text-dim)] mt-2">{donationMsg}</p>}
        <button
          type="button"
          onClick={saveDonation}
          disabled={donationSaving}
          className="btn-jam px-6 py-2 !mt-3 text-sm disabled:opacity-60"
        >
          {donationSaving ? "Saving…" : "Save"}
        </button>
      </div>

      <div className={card}>
        <h2 className="font-semibold mb-2">Legal</h2>
        <div className="flex flex-col gap-1.5 text-sm text-[var(--jm-jam)]">
          <Link to="/terms">Terms of Service</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/guidelines">Community Guidelines</Link>
        </div>
      </div>

      <div className={card}>
        <h2 className="font-semibold mb-2">Blocked users</h2>
        {blocked.length === 0 ? (
          <p className="text-sm text-[var(--jm-text-dim)]">You haven't blocked anyone.</p>
        ) : (
          blocked.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-2">
              <Avatar media={u.media} profilePhotoId={u.profilePhotoId} name={u.name} size={32} />
              <span className="flex-1 text-sm truncate">{u.name}</span>
              <button
                type="button"
                onClick={() => unblock(u.id)}
                className="text-xs px-3 py-1.5 rounded-full bg-[var(--jm-surface-2)] text-[var(--jm-text-dim)] hover:text-[var(--jm-text)]"
              >
                Unblock
              </button>
            </div>
          ))
        )}
      </div>

      <div className={card}>
        <h2 className="font-semibold mb-1">Your data</h2>
        <p className="text-sm text-[var(--jm-text-dim)] mb-3">
          Download a copy of your profile, listings and messages as a JSON file.
        </p>
        <button
          type="button"
          onClick={downloadData}
          className="px-4 py-2 rounded-full text-sm font-semibold bg-[var(--jm-surface-2)] border border-[var(--jm-border)]"
        >
          Download my data
        </button>
      </div>

      <div className={card}>
        <h2 className="font-semibold mb-1 text-[var(--jm-skip)]">Delete account</h2>
        <p className="text-sm text-[var(--jm-text-dim)] mb-3">
          Permanently deletes your profile, photos, music, listings and conversations. This cannot
          be undone.
        </p>
        {!confirmOpen ? (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="px-4 py-2 rounded-full text-sm font-semibold bg-[var(--jm-skip)] text-white"
          >
            Delete my account
          </button>
        ) : (
          <div>
            <label className="text-xs font-semibold text-[var(--jm-text-dim)] block mb-1">
              Enter your password to confirm
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--jm-surface-2)] border border-[var(--jm-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--jm-skip)]"
            />
            {error && <p className="form-error">{error}</p>}
            <div className="flex gap-3 mt-3">
              <button
                type="button"
                onClick={deleteAccount}
                disabled={deleting || !password}
                className="px-4 py-2 rounded-full text-sm font-semibold bg-[var(--jm-skip)] text-white disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Permanently delete"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  setPassword("");
                  setError("");
                }}
                className="px-4 py-2 rounded-full text-sm font-semibold bg-[var(--jm-surface-2)] text-[var(--jm-text-dim)]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
