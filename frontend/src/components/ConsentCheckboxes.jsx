import { Link } from "react-router-dom";

// "I agree" + 18+ confirmation, shared by signup and the re-accept gate.
export default function ConsentCheckboxes({ accepted, setAccepted, ofAge, setOfAge }) {
  const box = "mt-0.5 h-4 w-4 shrink-0 accent-[var(--jm-jam)]";
  const row = "flex items-start gap-2 cursor-pointer";
  return (
    <div className="flex flex-col gap-2.5 mt-4 text-xs text-[var(--jm-text-dim)] leading-snug">
      <label className={row} style={{ marginTop: 0, fontSize: "0.75rem" }}>
        <input
          type="checkbox"
          className={box}
          checked={ofAge}
          onChange={(e) => setOfAge(e.target.checked)}
        />
        <span>I am 18 years old or older.</span>
      </label>
      <label className={row} style={{ marginTop: 0, fontSize: "0.75rem" }}>
        <input
          type="checkbox"
          className={box}
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
        />
        <span>
          I agree to the{" "}
          <Link to="/terms" target="_blank" className="text-[var(--jm-jam)] underline">
            Terms of Service
          </Link>
          , the{" "}
          <Link to="/privacy" target="_blank" className="text-[var(--jm-jam)] underline">
            Privacy Policy
          </Link>{" "}
          and the{" "}
          <Link to="/guidelines" target="_blank" className="text-[var(--jm-jam)] underline">
            Community Guidelines
          </Link>
          .
        </span>
      </label>
    </div>
  );
}
