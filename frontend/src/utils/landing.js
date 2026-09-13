import api from "../api/client.js";

// Where to send someone right after signing in or finishing onboarding:
// Discover if there's actually someone to Jam with right now, otherwise
// Friends (used by both Login and Onboarding so the rule stays in one place).
export async function resolveLandingPage() {
  try {
    const { data } = await api.get("/discover");
    return data.results.length > 0 ? "/discover" : "/friends";
  } catch {
    // If the check fails, don't block the flow on it — default to Discover.
    return "/discover";
  }
}
