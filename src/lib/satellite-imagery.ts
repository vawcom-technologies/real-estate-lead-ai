import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ParcelBoundingBox } from "@/lib/parcel-geometry";

const IGN_WMS_BASE = "https://data.geopf.fr/wms-r/wms";
const GOOGLE_STATIC_MAPS_BASE =
  "https://maps.googleapis.com/maps/api/staticmap";
const IMAGE_SIZE = 512;
/** Blank/no-data WMS tiles are tiny JPEGs (~4 KB); real orthophotos are much larger. */
const MIN_IMAGE_BYTES = 8_000;

export function getGoogleMapsApiKey(): string | undefined {
  return process.env.GOOGLE_MAPS_API_KEY?.trim() || undefined;
}

export function detectPropertyImageMimeType(buffer: Buffer): string {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "image/jpeg";
  }

  if (
    buffer.length > 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  return "application/octet-stream";
}

const ORTHOPHOTO_LAYERS = [
  "HR.ORTHOIMAGERY.ORTHOPHOTOS",
  "ORTHOIMAGERY.ORTHOPHOTOS",
  "ORTHOIMAGERY.ORTHOPHOTOS.BDORTHO",
] as const;

const CADASTRAL_LAYER = "CADASTRALPARCELS.PARCELLAIRE_EXPRESS";

export const PROPERTY_IMAGES_DIR = path.join(process.cwd(), "property-images");

export function getPropertyImagePath(parcelId: string): string {
  const safeId = parcelId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(PROPERTY_IMAGES_DIR, `${safeId}.jpg`);
}

function formatBbox(bbox: ParcelBoundingBox): string {
  // WMS 1.3.0 + EPSG:4326 uses lat,lon axis order (south, west, north, east).
  return `${bbox.minLat},${bbox.minLon},${bbox.maxLat},${bbox.maxLon}`;
}

function buildWmsUrl(layer: string, bbox: ParcelBoundingBox): string {
  const params = new URLSearchParams({
    SERVICE: "WMS",
    VERSION: "1.3.0",
    REQUEST: "GetMap",
    LAYERS: layer,
    STYLES: "",
    CRS: "EPSG:4326",
    BBOX: formatBbox(bbox),
    WIDTH: String(IMAGE_SIZE),
    HEIGHT: String(IMAGE_SIZE),
    FORMAT: "image/jpeg",
  });

  return `${IGN_WMS_BASE}?${params}`;
}

function isValidImageBytes(bytes: Uint8Array): boolean {
  if (bytes.length < MIN_IMAGE_BYTES) {
    return false;
  }

  const buffer = Buffer.from(bytes);
  return detectPropertyImageMimeType(buffer).startsWith("image/");
}

async function fetchWmsImage(
  layer: string,
  bbox: ParcelBoundingBox,
): Promise<Buffer | null> {
  const response = await fetch(buildWmsUrl(layer, bbox));

  if (!response.ok) {
    return null;
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!isValidImageBytes(bytes)) {
    return null;
  }

  return Buffer.from(bytes);
}

function buildGoogleStaticMapUrl(
  bbox: ParcelBoundingBox,
  apiKey: string,
): string {
  const params = new URLSearchParams({
    maptype: "satellite",
    size: `${IMAGE_SIZE}x${IMAGE_SIZE}`,
    scale: "2",
    key: apiKey,
  });

  params.set(
    "visible",
    `${bbox.minLat},${bbox.minLon}|${bbox.maxLat},${bbox.maxLon}`,
  );

  return `${GOOGLE_STATIC_MAPS_BASE}?${params}`;
}

async function fetchGoogleSatelliteImage(
  bbox: ParcelBoundingBox,
  apiKey: string,
): Promise<Buffer | null> {
  const response = await fetch(buildGoogleStaticMapUrl(bbox, apiKey));

  if (!response.ok) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return null;
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!isValidImageBytes(bytes)) {
    return null;
  }

  return Buffer.from(bytes);
}

export async function fetchTopDownImage(
  bbox: ParcelBoundingBox,
): Promise<{ buffer: Buffer; source: string }> {
  const apiKey = getGoogleMapsApiKey();
  if (apiKey) {
    const googleImage = await fetchGoogleSatelliteImage(bbox, apiKey);
    if (googleImage) {
      return { buffer: googleImage, source: "Google Maps Satellite" };
    }
  }

  for (const layer of ORTHOPHOTO_LAYERS) {
    const buffer = await fetchWmsImage(layer, bbox);
    if (buffer) {
      return { buffer, source: `IGN ${layer}` };
    }
  }

  const cadastral = await fetchWmsImage(CADASTRAL_LAYER, bbox);
  if (cadastral) {
    return { buffer: cadastral, source: `IGN ${CADASTRAL_LAYER}` };
  }

  throw new Error("No satellite or cadastral imagery available for this parcel");
}

export async function savePropertyImage(
  parcelId: string,
  buffer: Buffer,
): Promise<string> {
  await mkdir(PROPERTY_IMAGES_DIR, { recursive: true });
  const imagePath = getPropertyImagePath(parcelId);
  await writeFile(imagePath, buffer);
  return imagePath;
}
