const APICARTO_CADASTRE_BASE = "https://apicarto.ign.fr/api/cadastre/parcelle";

export type ParcelCoordinates = {
  lon: number;
  lat: number;
};

export type ParcelBoundingBox = {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
};

type GeoJsonPosition = [number, number];
type GeoJsonPolygon = GeoJsonPosition[][];
type GeoJsonMultiPolygon = GeoJsonPolygon[];

type CadastreParcelFeature = {
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: GeoJsonPolygon | GeoJsonMultiPolygon;
  };
};

export function parseCadastreParcelId(parcelId: string): {
  codeInsee: string;
  section: string;
  numero: string;
} {
  return {
    codeInsee: parcelId.slice(0, 5),
    section: parcelId.slice(8, 10),
    numero: parcelId.slice(10),
  };
}

function flattenPositions(
  geometry: CadastreParcelFeature["geometry"],
): GeoJsonPosition[] {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.flat();
  }

  return geometry.coordinates.flat(2);
}

export function centroidFromPositions(
  positions: GeoJsonPosition[],
): ParcelCoordinates {
  let lonSum = 0;
  let latSum = 0;

  for (const [lon, lat] of positions) {
    lonSum += lon;
    latSum += lat;
  }

  return {
    lon: lonSum / positions.length,
    lat: latSum / positions.length,
  };
}

export function boundingBoxFromPositions(
  positions: GeoJsonPosition[],
  paddingRatio = 0.2,
): ParcelBoundingBox {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  for (const [lon, lat] of positions) {
    minLon = Math.min(minLon, lon);
    minLat = Math.min(minLat, lat);
    maxLon = Math.max(maxLon, lon);
    maxLat = Math.max(maxLat, lat);
  }

  const lonPad = Math.max((maxLon - minLon) * paddingRatio, 0.00015);
  const latPad = Math.max((maxLat - minLat) * paddingRatio, 0.00015);

  return {
    minLon: minLon - lonPad,
    minLat: minLat - latPad,
    maxLon: maxLon + lonPad,
    maxLat: maxLat + latPad,
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Cadastre fetch failed (${response.status}): ${url}`);
  }

  return response.json() as Promise<T>;
}

export async function getParcelGeometry(
  parcelId: string,
  options?: { paddingRatio?: number },
): Promise<{
  centroid: ParcelCoordinates;
  bbox: ParcelBoundingBox;
}> {
  const { codeInsee, section, numero } = parseCadastreParcelId(parcelId);
  const params = new URLSearchParams({
    code_insee: codeInsee,
    section,
    numero,
  });

  const data = await fetchJson<{ features: CadastreParcelFeature[] }>(
    `${APICARTO_CADASTRE_BASE}?${params}`,
  );

  const feature = data.features[0];
  if (!feature) {
    throw new Error(`Cadastre parcel not found: ${parcelId}`);
  }

  const positions = flattenPositions(feature.geometry);
  if (positions.length === 0) {
    throw new Error(`Cadastre parcel has no geometry: ${parcelId}`);
  }

  return {
    centroid: centroidFromPositions(positions),
    bbox: boundingBoxFromPositions(
      positions,
      options?.paddingRatio ?? 0.2,
    ),
  };
}
