import type { ParcelBoundingBox } from "@/lib/parcel-geometry";

const IGN_ELEVATION_API =
  "https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json";
const OVERPASS_API = "https://overpass-api.de/api/interpreter";
const OVERPASS_DELAY_MS = 1100;

let overpassLastRequestAt = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttleOverpass() {
  const elapsed = Date.now() - overpassLastRequestAt;
  if (elapsed < OVERPASS_DELAY_MS) {
    await sleep(OVERPASS_DELAY_MS - elapsed);
  }
  overpassLastRequestAt = Date.now();
}

type IgnElevationResponse = {
  elevations: Array<{ lon: number; lat: number; z: number }>;
};

type OverpassElement = {
  type: string;
  tags?: Record<string, string>;
};

function samplePoints(bbox: ParcelBoundingBox): Array<{ lon: number; lat: number }> {
  const latMid = (bbox.minLat + bbox.maxLat) / 2;
  const lonMid = (bbox.minLon + bbox.maxLon) / 2;

  return [
    { lon: bbox.minLon, lat: bbox.minLat },
    { lon: bbox.maxLon, lat: bbox.minLat },
    { lon: bbox.minLon, lat: bbox.maxLat },
    { lon: bbox.maxLon, lat: bbox.maxLat },
    { lon: lonMid, lat: latMid },
  ];
}

export function estimateSlopePercent(
  bbox: ParcelBoundingBox,
  elevations: number[],
): number | null {
  const valid = elevations.filter((value) => Number.isFinite(value));
  if (valid.length < 2) {
    return null;
  }

  const latMid = (bbox.minLat + bbox.maxLat) / 2;
  const metersPerDegLat = 111_320;
  const metersPerDegLon =
    111_320 * Math.cos((latMid * Math.PI) / 180);
  const widthM = Math.max((bbox.maxLon - bbox.minLon) * metersPerDegLon, 1);
  const heightM = Math.max((bbox.maxLat - bbox.minLat) * metersPerDegLat, 1);
  const spanM = Math.max(widthM, heightM);
  const elevRange = Math.max(...valid) - Math.min(...valid);

  return (elevRange / spanM) * 100;
}

export async function fetchParcelSlopePercent(
  bbox: ParcelBoundingBox,
): Promise<number | null> {
  const points = samplePoints(bbox);
  const lons = points.map((point) => point.lon).join("|");
  const lats = points.map((point) => point.lat).join("|");

  const params = new URLSearchParams({
    lon: lons,
    lat: lats,
    resource: "ign_rge_alti_wld",
    delimiter: "|",
  });

  const response = await fetch(`${IGN_ELEVATION_API}?${params}`);
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as IgnElevationResponse;
  const elevations = data.elevations.map((entry) => entry.z);

  return estimateSlopePercent(bbox, elevations);
}

function buildOverpassQuery(bbox: ParcelBoundingBox): string {
  const south = bbox.minLat;
  const west = bbox.minLon;
  const north = bbox.maxLat;
  const east = bbox.maxLon;

  return `[out:json][timeout:25];(node["natural"="tree"](${south},${west},${north},${east});way["natural"="tree"](${south},${west},${north},${east});node["natural"="wood"](${south},${west},${north},${east});way["natural"="wood"](${south},${west},${north},${east});way["landuse"~"forest|orchard"](${south},${west},${north},${east});node["leisure"="swimming_pool"](${south},${west},${north},${east});way["leisure"="swimming_pool"](${south},${west},${north},${east}););out tags;`;
}

export async function fetchParcelEnvironment(bbox: ParcelBoundingBox): Promise<{
  vegetationFeatureCount: number;
  hasPool: boolean;
}> {
  await throttleOverpass();

  const response = await fetch(OVERPASS_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "terrace-prospector/0.1",
    },
    body: `data=${encodeURIComponent(buildOverpassQuery(bbox))}`,
  });

  if (!response.ok) {
    return { vegetationFeatureCount: 0, hasPool: false };
  }

  const data = (await response.json()) as { elements: OverpassElement[] };
  let vegetationFeatureCount = 0;
  let hasPool = false;

  for (const element of data.elements) {
    const tags = element.tags ?? {};

    if (tags.leisure === "swimming_pool") {
      hasPool = true;
      continue;
    }

    if (
      tags.natural === "tree" ||
      tags.natural === "wood" ||
      tags.landuse === "forest" ||
      tags.landuse === "orchard"
    ) {
      vegetationFeatureCount += 1;
    }
  }

  return { vegetationFeatureCount, hasPool };
}
