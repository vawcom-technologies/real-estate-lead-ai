/**
 * Phase 4 — marketing PDF generation smoke test (no DB)
 *
 * Run: npm run test:marketing-pdfs
 */

const CAMPAIGN = {
  id: "demo-campaign",
  postcode: "33290",
  min_price: 250000,
  agent_name: "Marie Dupont",
  agent_phone: "+33 6 12 34 56 78",
  agent_email: "marie.dupont@thermcross.fr",
  created_at: new Date("2026-01-15"),
};

const PARCEL = {
  department: "33 - Gironde",
  municipality: "Le Pian-Médoc",
  section: "AI",
  parcel_number: "33322000AI0234",
  sale_price: 466150,
  sale_date: new Date("2022-06-15"),
  address: "153 All Montesquieu",
  house_area: 100,
  plot_area: 2177,
  grade: "A",
  reason: "Large backyard; Few trees; Flat terrain; Easy access from house",
  analysis: JSON.stringify({
    free_backyard_area: "Large open lawn",
    terrain_slope: "Flat",
    vegetation_density: "Sparse",
    terrace_feasibility: "High",
    summary: "Excellent terrace prospect",
  }),
};

async function main() {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const { buildPostcardPdf } = await import("../src/lib/marketing/postcard.ts");
  const { buildCampaignSummaryPdf, buildPropertyReportPdf } = await import(
    "../src/lib/marketing/report.ts"
  );

  const outputDir = path.join(process.cwd(), "exports", "marketing-test");
  await mkdir(outputDir, { recursive: true });

  const [postcard, report, summary] = await Promise.all([
    buildPostcardPdf(CAMPAIGN, PARCEL),
    buildPropertyReportPdf(CAMPAIGN, PARCEL),
    buildCampaignSummaryPdf(CAMPAIGN, [PARCEL]),
  ]);

  await writeFile(path.join(outputDir, "postcard.pdf"), postcard);
  await writeFile(path.join(outputDir, "report.pdf"), report);
  await writeFile(path.join(outputDir, "summary.pdf"), summary);

  console.log("Marketing PDF smoke test complete:\n");
  console.log(`  Postcard: ${postcard.length} bytes`);
  console.log(`  Report:   ${report.length} bytes`);
  console.log(`  Summary:  ${summary.length} bytes`);
  console.log(`\nSaved to ${outputDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
