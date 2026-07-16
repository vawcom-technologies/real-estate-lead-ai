/**
 * Phase 4 — marketing package smoke test
 *
 * Run: npm run test:marketing
 * With campaign id: npm run test:marketing -- <campaignId>
 */

async function main() {
  const campaignId = process.argv[2];

  if (!campaignId) {
    console.log("Usage: npm run test:marketing -- <campaignId>");
    console.log("Generate a package from an existing completed campaign.");
    process.exit(1);
  }

  const { generateMarketingPackage } = await import(
    "../src/lib/marketing-export.ts"
  );

  console.log(`Generating marketing package for ${campaignId}...\n`);
  const result = await generateMarketingPackage(campaignId);

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
