/**
 * Day 4 — extraction flow smoke test (no DB)
 *
 * Run: node scripts/test-extraction.mjs [postcode]
 */

const postcode = process.argv[2] ?? "33290";

const DVF_API_BASE = "https://app.dvf.etalab.gouv.fr/api";
const CADASTRE_BASE =
  "https://cadastre.data.gouv.fr/bundler/cadastre-etalab/communes";
const GEO_API_BASE = "https://geo.api.gouv.fr";

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`${url} → HTTP ${response.status}`);
  }
  return response.json();
}

async function getMunicipalities(input) {
  const url = /^\d{5}$/.test(input)
    ? `${GEO_API_BASE}/communes?codePostal=${input}`
    : `${GEO_API_BASE}/communes?codeDepartement=${input}`;

  const communes = await fetchJson(url);
  return communes.map((c) => ({
    code: c.code,
    name: c.nom,
    departmentCode: c.codeDepartement,
  }));
}

async function getSections(municipalityCode) {
  const data = await fetchJson(
    `${CADASTRE_BASE}/${municipalityCode}/geojson/sections`,
  );
  return data.features.map((feature) => ({
    id: feature.id,
    apiPrefix: feature.id.slice(5, 10),
  }));
}

async function getSales(municipalityCode, sectionPrefix) {
  const data = await fetchJson(
    `${DVF_API_BASE}/mutations3/${municipalityCode}/${sectionPrefix}`,
  );
  return data.mutations.filter((row) => row.type_local === "Maison");
}

async function getParcels(municipalityCode) {
  const sections = await getSections(municipalityCode);
  const parcelIds = new Set();

  for (const section of sections) {
    const sales = await getSales(municipalityCode, section.apiPrefix);
    for (const sale of sales) {
      parcelIds.add(sale.id_parcelle);
    }
  }

  return [...parcelIds].sort();
}

async function main() {
  console.log(`Extraction test for postcode: ${postcode}\n`);

  const municipalities = await getMunicipalities(postcode);
  console.log(`Municipalities: ${municipalities.length}`);

  const target =
    municipalities.find((m) => m.name === "Le Pian-Médoc") ?? municipalities[0];

  console.log(`Testing commune: ${target.name} (${target.code})\n`);

  const parcels = await getParcels(target.code);
  console.log(`House parcels found: ${parcels.length}`);
  console.log(`Sample parcels: ${parcels.slice(0, 5).join(", ")}\n`);

  const sections = await getSections(target.code);
  const ai = sections.find((s) => s.id.endsWith("AI"));
  if (ai) {
    const sales = await getSales(target.code, ai.apiPrefix);
    console.log(`Sales in section AI (Maison): ${sales.length}`);
    if (sales[0]) {
      console.log(
        JSON.stringify(
          {
            municipality: sales[0].nom_commune,
            parcel: sales[0].id_parcelle,
            salePrice: sales[0].valeur_fonciere,
            saleDate: sales[0].date_mutation,
          },
          null,
          2,
        ),
      );
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
