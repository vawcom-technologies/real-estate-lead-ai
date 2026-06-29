/**
 * Week 2 Task 4 — AI vision analysis smoke test
 *
 * Run: npm run test:vision-analysis
 * Live (requires OPENAI_API_KEY + property image):
 *   npm run test:vision-analysis -- --live
 */

const PARCEL_ID = "33322000AI0234";

async function main() {
  const { isVisionAnalysisEnabled } = await import(
    "../src/lib/vision-analysis.ts"
  );

  console.log("Vision analysis tests\n");
  console.log(`API configured: ${isVisionAnalysisEnabled()}`);

  if (!process.argv.includes("--live")) {
    console.log("\nSkipped live test. Pass --live to call OpenAI Vision.");
    return;
  }

  if (!isVisionAnalysisEnabled()) {
    console.error("Set OPENAI_API_KEY in .env to run the live test.");
    process.exit(1);
  }

  const { analyzePropertyImage } = await import("../src/lib/vision-analysis.ts");

  console.log(`\nAnalyzing ${PARCEL_ID}...\n`);
  const result = await analyzePropertyImage(PARCEL_ID);

  console.log(`Grade: ${result.grade}`);
  console.log(`Reason: ${result.reason}`);
  console.log("\nEstimates:");
  console.log(JSON.stringify(result.estimates, null, 2));
  console.log("\nStored analysis:");
  console.log(result.analysis);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
