/**
 * Day 3 — parcel data feasibility test
 *
 * Question: can we get parcel IDs from a postcode/department?
 *
 * Strategy (2-step chain, no direct "postcode → parcels" API):
 *   1. geo.api.gouv.fr  — department/postcode → commune INSEE codes
 *   2. apicarto.ign.fr  — code_insee → cadastral parcels (PCI Express)
 *
 * Run: node scripts/test-parcel-fetch.mjs
 */

const postcode = "33"; // Gironde department (dept code, not a 5-digit code postal)

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} → HTTP ${response.status}`);
  }
  return response.json();
}

function formatParcel(feature) {
  const { nom_com: municipality, idu: parcel } = feature.properties;
  return { municipality, parcel };
}

async function communesForInput(input) {
  // 5-digit code postal
  if (/^\d{5}$/.test(input)) {
    return fetchJson(`https://geo.api.gouv.fr/communes?codePostal=${input}`);
  }

  // 2–3 char department code (e.g. "33", "971")
  if (/^\d{2,3}$/.test(input)) {
    return fetchJson(
      `https://geo.api.gouv.fr/communes?codeDepartement=${input}`,
    );
  }

  throw new Error(
    `Unsupported postcode format "${input}" — use a department (33) or code postal (33290)`,
  );
}

async function parcelsForCommune(codeInsee, { section, numero } = {}) {
  const params = new URLSearchParams({ code_insee: codeInsee });
  if (section) params.set("section", section);
  if (numero) params.set("numero", numero);

  const data = await fetchJson(
    `https://apicarto.ign.fr/api/cadastre/parcelle?${params}`,
  );

  return data.features ?? [];
}

async function main() {
  console.log(`Testing parcel fetch for postcode/department: ${postcode}\n`);

  const communes = await communesForInput(postcode);
  console.log(`Communes in department ${postcode}: ${communes.length}`);

  // Target commune from the Day 3 expected example
  const target =
    communes.find((c) => c.nom === "Le Pian-Médoc") ??
    communes.find((c) => c.codesPostaux?.includes("33290"));

  if (!target) {
    throw new Error("Could not find Le Pian-Médoc in department 33");
  }

  console.log(`Using commune: ${target.nom} (${target.code})\n`);

  // Known parcel in Le Pian-Médoc — proves end-to-end lookup works
  const known = await parcelsForCommune(target.code, {
    section: "AI",
    numero: "0234",
  });

  const results = known.map(formatParcel);

  // Also show we can list parcels without knowing section/number upfront
  if (results.length === 0) {
    const page = await parcelsForCommune(target.code);
    results.push(...page.slice(0, 3).map(formatParcel));
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
