import { useState } from "react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import ConsentCheckboxes from "./ConsentCheckboxes.jsx";

// Blocks the app until the user accepts the current Terms — shown to
// accounts created before consent existed, and again after material changes.
export default function TermsGate() {
  const { refreshUser, logout } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [ofAge, setOfAge] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/users/me/accept-terms", { acceptedTerms: true, confirmedAge: true });
      await refreshUser();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <h1 className="brand-title">Jamminspot</h1>
        <p className="auth-subtitle">
          We've added Terms of Service and a Privacy Policy. Please review and accept them to keep
          using Jamminspot.
        </p>
        <ConsentCheckboxes
          accepted={accepted}
          setAccepted={setAccepted}
          ofAge={ofAge}
          setOfAge={setOfAge}
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-jam" disabled={!accepted || !ofAge || submitting}>
          {submitting ? "Saving…" : "Accept and continue"}
        </button>
        <button
          type="button"
          onClick={logout}
          className="mt-3 text-xs text-[var(--jm-text-dim)] underline"
        >
          Sign out instead
        </button>
      </form>
    </div>
  );
}
