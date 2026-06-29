const BAN_API_BASE = "https://api-adresse.data.gouv.fr";
const NOMINATIM_API_BASE = "https://nominatim.openstreetmap.org";
const GOOGLE_GEOCODE_API_BASE =
  "https://maps.googleapis.com/maps/api/geocode/json";
const NOMINATIM_USER_AGENT = "terrace-prospector/0.1";
const NOMINATIM_DELAY_MS = 1100;

const BAN_MIN_SCORE = 0.4;

const NON_RESIDENTIAL_KEYWORDS = [
  "restaurant",
  "restauration",
  "hotel",
  "hôtel",
  "motel",
  "office",
  "bureau",
  "store",
  "magasin",
  "boutique",
  "shop",
  "warehouse",
  "entrepôt",
  "entrepot",
  "factory",
  "usine",
] as const;

const OSM_REJECT_BY_CLASS: Record<string, string[] | true> = {
  amenity: [
    "restaurant",
    "bar",
    "cafe",
    "fast_food",
    "food_court",
    "pub",
    "biergarten",
  ],
  tourism: ["hotel", "motel", "hostel", "guest_house"],
  shop: true,
  office: true,
  industrial: true,
  building: [
    "commercial",
    "industrial",
    "retail",
    "warehouse",
    "office",
    "hotel",
    "supermarket",
    "kiosk",
  ],
  landuse: ["commercial", "industrial", "retail", "warehouse"],
};

const GOOGLE_NON_RESIDENTIAL_TYPES = new Set([
  "restaurant",
  "food",
  "lodging",
  "store",
  "shopping_mall",
  "supermarket",
  "convenience_store",
  "department_store",
  "warehouse",
  "storage",
  "office",
  "factory",
  "industrial",
  "bar",
  "cafe",
  "bakery",
  "meal_takeaway",
  "meal_delivery",
  "night_club",
  "wholesale",
]);

export type AddressValidationInput = {
  address: string | null;
  municipality: string;
  postcode?: string;
};

export type AddressValidationSource = "keyword" | "ban" | "osm" | "google";

export type AddressValidationResult = {
  valid: boolean;
  reason: string;
  rejectedBy?: AddressValidationSource;
};

type BanFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    label: string;
    score: number;
    type: string;
    city: string;
  };
};

type OsmSearchResult = {
  class: string;
  type: string;
  display_name: string;
};

type GoogleGeocodeResult = {
  status: string;
  results: Array<{
    formatted_address: string;
    types: string[];
  }>;
};

let nominatimLastRequestAt = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function containsNonResidentialKeyword(text: string): string | null {
  const normalized = normalizeText(text);

  for (const keyword of NON_RESIDENTIAL_KEYWORDS) {
    if (normalized.includes(normalizeText(keyword))) {
      return keyword;
    }
  }

  return null;
}

function buildBanQuery(input: AddressValidationInput): string {
  const parts = [input.address, input.municipality, input.postcode].filter(
    (part): part is string => Boolean(part?.trim()),
  );

  return parts.join(" ");
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`Address validation fetch failed (${response.status}): ${url}`);
  }

  return response.json() as Promise<T>;
}

async function throttleNominatim() {
  const elapsed = Date.now() - nominatimLastRequestAt;
  if (elapsed < NOMINATIM_DELAY_MS) {
    await sleep(NOMINATIM_DELAY_MS - elapsed);
  }
  nominatimLastRequestAt = Date.now();
}

function isOsmNonResidential(result: OsmSearchResult): string | null {
  const rule = OSM_REJECT_BY_CLASS[result.class];
  if (!rule) {
    return null;
  }

  if (rule === true) {
    return `${result.class}`;
  }

  if (rule.includes(result.type)) {
    return `${result.class}=${result.type}`;
  }

  return null;
}

async function validateWithBan(
  input: AddressValidationInput,
): Promise<
  | { ok: true; coordinates: [number, number]; label: string }
  | { ok: false; reason: string }
> {
  const query = buildBanQuery(input);
  const data = await fetchJson<{ features: BanFeature[] }>(
    `${BAN_API_BASE}/search/?q=${encodeURIComponent(query)}&limit=5`,
  );

  const normalizedMunicipality = normalizeText(input.municipality);
  const match =
    data.features.find(
      (feature) =>
        feature.properties.type === "housenumber" &&
        feature.properties.score >= BAN_MIN_SCORE &&
        normalizeText(feature.properties.city) === normalizedMunicipality,
    ) ??
    data.features.find(
      (feature) =>
        feature.properties.type === "housenumber" &&
        feature.properties.score >= BAN_MIN_SCORE,
    );

  if (!match) {
    return {
      ok: false,
      reason: "BAN: no housenumber match for this address",
    };
  }

  const labelKeyword = containsNonResidentialKeyword(match.properties.label);
  if (labelKeyword) {
    return {
      ok: false,
      reason: `BAN: address label contains "${labelKeyword}"`,
    };
  }

  const [lon, lat] = match.geometry.coordinates;
  return {
    ok: true,
    coordinates: [lon, lat],
    label: match.properties.label,
  };
}

async function fetchOsmResults(
  input: AddressValidationInput,
  coordinates?: [number, number],
): Promise<OsmSearchResult[]> {
  await throttleNominatim();

  if (coordinates) {
    const [lon, lat] = coordinates;
    const reverse = await fetchJson<OsmSearchResult>(
      `${NOMINATIM_API_BASE}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=18`,
      { headers: { "User-Agent": NOMINATIM_USER_AGENT } },
    );

    return reverse.class ? [reverse] : [];
  }

  const query = buildBanQuery(input);
  const results = await fetchJson<OsmSearchResult[]>(
    `${NOMINATIM_API_BASE}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`,
    { headers: { "User-Agent": NOMINATIM_USER_AGENT } },
  );

  return results;
}

async function validateWithOsm(
  input: AddressValidationInput,
  coordinates?: [number, number],
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const results = await fetchOsmResults(input, coordinates);

  for (const result of results) {
    const labelKeyword = containsNonResidentialKeyword(result.display_name);
    if (labelKeyword) {
      return {
        ok: false,
        reason: `OpenStreetMap: address contains "${labelKeyword}"`,
      };
    }

    const osmMatch = isOsmNonResidential(result);
    if (osmMatch) {
      return {
        ok: false,
        reason: `OpenStreetMap: non-residential place (${osmMatch})`,
      };
    }
  }

  return { ok: true };
}

async function validateWithGoogle(
  input: AddressValidationInput,
): Promise<{ ok: true } | { ok: false; reason: string } | { ok: null }> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) {
    return { ok: null };
  }

  const query = buildBanQuery(input);
  const data = await fetchJson<GoogleGeocodeResult>(
    `${GOOGLE_GEOCODE_API_BASE}?address=${encodeURIComponent(query)}&key=${apiKey}`,
  );

  if (data.status === "ZERO_RESULTS") {
    return {
      ok: false,
      reason: "Google Maps: address not found",
    };
  }

  if (data.status !== "OK" || data.results.length === 0) {
    return {
      ok: false,
      reason: `Google Maps: geocoding failed (${data.status})`,
    };
  }

  const topResult = data.results[0];
  const labelKeyword = containsNonResidentialKeyword(
    topResult.formatted_address,
  );
  if (labelKeyword) {
    return {
      ok: false,
      reason: `Google Maps: address contains "${labelKeyword}"`,
    };
  }

  const nonResidentialType = topResult.types.find((type) =>
    GOOGLE_NON_RESIDENTIAL_TYPES.has(type),
  );
  if (nonResidentialType) {
    return {
      ok: false,
      reason: `Google Maps: non-residential place type (${nonResidentialType})`,
    };
  }

  return { ok: true };
}

export async function validateResidentialAddress(
  input: AddressValidationInput,
): Promise<AddressValidationResult> {
  if (!input.address?.trim()) {
    return {
      valid: false,
      reason: "Missing address",
      rejectedBy: "keyword",
    };
  }

  const addressKeyword = containsNonResidentialKeyword(input.address);
  if (addressKeyword) {
    return {
      valid: false,
      reason: `Address contains non-residential keyword "${addressKeyword}"`,
      rejectedBy: "keyword",
    };
  }

  const ban = await validateWithBan(input);
  if (!ban.ok) {
    return {
      valid: false,
      reason: ban.reason,
      rejectedBy: "ban",
    };
  }

  const osm = await validateWithOsm(input, ban.coordinates);
  if (!osm.ok) {
    return {
      valid: false,
      reason: osm.reason,
      rejectedBy: "osm",
    };
  }

  const google = await validateWithGoogle(input);
  if (google.ok === false) {
    return {
      valid: false,
      reason: google.reason,
      rejectedBy: "google",
    };
  }

  const googleNote =
    google.ok === null ? " (Google Maps skipped — no API key)" : "";

  return {
    valid: true,
    reason: `Residential address confirmed via BAN (${ban.label}) and OpenStreetMap${googleNote}`,
  };
}
