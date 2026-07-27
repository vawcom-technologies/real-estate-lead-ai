/**
 * Phase 4 — before/after image generation smoke test
 *
 * Run: npm run test:before-after -- <parcelNumber>
 * Example: npm run test:before-after -- 33322000AI0234
 *
 * Requires OPENAI_API_KEY and an existing before image in property-images/
 */

async function main() {
  const parcelId = process.argv[2];

  if (!parcelId) {
    console.log("Usage: npm run test:before-after -- <parcelNumber>");
    process.exit(1);
  }

  const { generateAfterImage, isImageGenerationEnabled } = await import(
    "../src/lib/image-generation.ts"
  );

  if (!isImageGenerationEnabled()) {
    console.error("OPENAI_API_KEY is not set");
    process.exit(1);
  }

  console.log(`Generating after image for ${parcelId}...\n`);
  const result = await generateAfterImage(parcelId);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
