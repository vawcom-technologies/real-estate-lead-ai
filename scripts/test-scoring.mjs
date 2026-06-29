/**
 * Week 2 Task 3 — rule-based scoring tests
 *
 * Run: npm run test:scoring
 */

const CASES = [
  {
    label: "Grade A — large flat yard, few trees, easy access",
    input: {
      plotAreaM2: 1200,
      houseAreaM2: 100,
      vegetationFeatureCount: 1,
      hasPool: false,
      slopePercent: 3,
    },
    expectGrade: "A",
  },
  {
    label: "Grade B — decent space with some vegetation",
    input: {
      plotAreaM2: 600,
      houseAreaM2: 120,
      vegetationFeatureCount: 5,
      hasPool: false,
      slopePercent: 8,
    },
    expectGrade: "B",
  },
  {
    label: "Grade C — small plot, heavy vegetation, steep",
    input: {
      plotAreaM2: 200,
      houseAreaM2: 110,
      vegetationFeatureCount: 12,
      hasPool: false,
      slopePercent: 18,
    },
    expectGrade: "C",
  },
  {
    label: "Grade C — pool detected",
    input: {
      plotAreaM2: 900,
      houseAreaM2: 100,
      vegetationFeatureCount: 1,
      hasPool: true,
      slopePercent: 2,
    },
    expectGrade: "C",
  },
];

async function main() {
  const { scoreParcel } = await import("../src/lib/scoring.ts");

  console.log("Rule-based scoring tests\n");

  let passed = 0;

  for (const testCase of CASES) {
    const result = scoreParcel(testCase.input);
    const ok = result.grade === testCase.expectGrade;

    console.log(`${ok ? "PASS" : "FAIL"} — ${testCase.label}`);
    console.log(`  grade: ${result.grade}`);
    console.log(`  reason: ${result.reason}`);
    console.log(`  backyard: ${Math.round(result.backyardM2)} m²`);
    console.log();

    if (ok) {
      passed += 1;
    }
  }

  console.log(`${passed}/${CASES.length} passed`);

  if (process.argv.includes("--live")) {
    const { scoreParcelRecord } = await import("../src/lib/run-scoring.ts");
    console.log("\nLive scoring for 33322000AI0234...\n");
    const live = await scoreParcelRecord({
      parcel_number: "33322000AI0234",
      plot_area: 2177,
      house_area: 100,
    });
    console.log(JSON.stringify(live, null, 2));
  }

  if (passed !== CASES.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
