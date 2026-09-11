import axios from "axios";

// Photon (komoot) — free, no API key, CORS-enabled. Returns place names in
// their local language by default (e.g. Greek names for Greek places),
// which is what we want for city/village search.
const photon = axios.create({ baseURL: "https://photon.komoot.io/api/" });

export async function searchCountries(query) {
  if (!query || query.trim().length < 2) return [];
  const { data } = await photon.get("", {
    params: { q: query.trim(), limit: 8, lang: "en", osm_tag: "place:country" },
  });
  return (data.features || [])
    .filter((f) => f.properties.osm_value === "country")
    .map((f) => ({
      name: f.properties.name,
      countryCode: f.properties.countrycode,
    }));
}

const CITY_TAGS = ["place:city", "place:town", "place:village", "place:hamlet"];

export async function searchCities(query, countryCode) {
  if (!query || query.trim().length < 2) return [];

  // Built manually (not via axios `params`) so repeated osm_tag keys are
  // sent as osm_tag=a&osm_tag=b — axios's default array serialization
  // would send osm_tag[]=a instead, which Photon ignores.
  const search = new URLSearchParams({ q: query.trim(), limit: "15" });
  for (const tag of CITY_TAGS) search.append("osm_tag", tag);

  const { data } = await photon.get(`?${search.toString()}`);

  return (data.features || [])
    .filter((f) => !countryCode || f.properties.countrycode === countryCode)
    .slice(0, 8)
    .map((f) => ({
      name: f.properties.name,
      state: f.properties.state,
      countryCode: f.properties.countrycode,
      country: f.properties.country,
      longitude: f.geometry.coordinates[0],
      latitude: f.geometry.coordinates[1],
    }));
}
