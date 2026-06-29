/**
 * Week 2 — address validation smoke test (live APIs, no DB)
 *
 * Run: npm run test:address-validation
 */

const CASES = [
  {
    label: "Residential house (Le Pian-Médoc)",
    input: {
      address: "153 All Montesquieu",
      municipality: "Le Pian-Médoc",
      postcode: "33290",
    },
    expectValid: true,
  },
  {
    label: "Keyword rejection (restaurant)",
    input: {
      address: "12 Restaurant de la Gare",
      municipality: "Bordeaux",
      postcode: "33000",
    },
    expectValid: false,
  },
  {
    label: "Keyword rejection (hotel)",
    input: {
      address: "5 Hotel du Parc",
      municipality: "Bordeaux",
      postcode: "33000",
    },
    expectValid: false,
  },
];

async function main() {
  const { validateResidentialAddress } = await import(
    "../src/lib/address-validation.ts"
  );

  console.log("Address validation tests\n");

  let passed = 0;

  for (const testCase of CASES) {
    const result = await validateResidentialAddress(testCase.input);
    const ok = result.valid === testCase.expectValid;

    console.log(`${ok ? "PASS" : "FAIL"} — ${testCase.label}`);
    console.log(`  valid: ${result.valid}`);
    console.log(`  reason: ${result.reason}`);
    if (result.rejectedBy) {
      console.log(`  rejectedBy: ${result.rejectedBy}`);
    }
    console.log();

    if (ok) {
      passed += 1;
    }
  }

  console.log(`${passed}/${CASES.length} passed`);

  if (passed !== CASES.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
