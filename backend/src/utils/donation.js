// Donations are sent through the recipient's own page on a payment/support
// platform — Jamminspot never touches the money. Only well-known hosts are
// accepted so a profile can't carry an arbitrary (phishing) link.
const ALLOWED_HOSTS = [
  "paypal.me",
  "paypal.com",
  "revolut.me",
  "buymeacoffee.com",
  "ko-fi.com",
  "patreon.com",
  "liberapay.com",
  "venmo.com",
  "cash.app",
  "github.com",
];

// Returns { url } (normalized https URL, or "" to clear) or { error }.
export function normalizeDonationUrl(input) {
  if (input === undefined || input === null || String(input).trim() === "") return { url: "" };

  let raw = String(input).trim();
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return { error: "That doesn't look like a valid link" };
  }

  const host = parsed.hostname.toLowerCase();
  const allowed = ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  if (!allowed) {
    return {
      error: "Use a link from PayPal.me, Revolut.me, Ko-fi, Buy Me a Coffee, Patreon, Liberapay, Venmo, Cash App or GitHub Sponsors",
    };
  }
  if (host === "github.com" && !parsed.pathname.toLowerCase().startsWith("/sponsors/")) {
    return { error: "For GitHub, use your github.com/sponsors/<name> link" };
  }
  if (parsed.username || parsed.password) return { error: "Remove credentials from the link" };

  parsed.protocol = "https:";
  const url = parsed.toString();
  if (url.length > 300) return { error: "That link is too long" };
  return { url };
}
