/**
 * Week 2 Task 2 — satellite image retrieval smoke test (live APIs, no DB)
 *
 * Run: npm run test:satellite-imagery
 */

const PARCEL_ID = "33322000AI0234";

async function main() {
  const { getParcelGeometry } = await import("../src/lib/parcel-geometry.ts");
  const {
    fetchTopDownImage,
    getGoogleMapsApiKey,
    getPropertyImagePath,
    savePropertyImage,
  } = await import("../src/lib/satellite-imagery.ts");

  console.log(`Satellite imagery test for parcel ${PARCEL_ID}\n`);

  const googleKey = getGoogleMapsApiKey();
  console.log(
    googleKey
      ? "GOOGLE_MAPS_API_KEY is set — Google Maps Satellite will be used first."
      : "No GOOGLE_MAPS_API_KEY — falling back to IGN WMS orthophotos.",
  );
  console.log();

  const { centroid, bbox } = await getParcelGeometry(PARCEL_ID);
  console.log(`Centroid: ${centroid.lat.toFixed(6)}, ${centroid.lon.toFixed(6)}`);
  console.log(
    `BBox: ${bbox.minLon.toFixed(6)},${bbox.minLat.toFixed(6)} → ${bbox.maxLon.toFixed(6)},${bbox.maxLat.toFixed(6)}`,
  );

  const { buffer, source } = await fetchTopDownImage(bbox);
  const imagePath = await savePropertyImage(PARCEL_ID, buffer);

  console.log(`\nSource: ${source}`);
  console.log(`Saved: ${imagePath}`);
  console.log(`Size: ${buffer.length} bytes`);
  console.log(`Expected path: ${getPropertyImagePath(PARCEL_ID)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
