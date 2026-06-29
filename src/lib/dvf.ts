const DVF_API_BASE = "https://app.dvf.etalab.gouv.fr/api";
const CADASTRE_BASE =
  "https://cadastre.data.gouv.fr/bundler/cadastre-etalab/communes";
const GEO_API_BASE = "https://geo.api.gouv.fr";

export type Municipality = {
  code: string;
  name: string;
  departmentCode: string;
  postcodes: string[];
};

export type CadastreSection = {
  id: string;
  code: string;
  prefix: string;
  apiPrefix: string;
};

export type CadastreParcel = {
  id: string;
  municipalityCode: string;
  section: string;
  number: string;
  areaM2: number | null;
};

export type DvfSale = {
  mutationId: string;
  parcelId: string;
  municipalityCode: string;
  municipalityName: string;
  departmentCode: string;
  section: string;
  salePrice: number;
  saleDate: string;
  address: string | null;
  houseAreaM2: number | null;
  plotAreaM2: number | null;
  propertyType: string;
};

type GeoCommune = {
  nom: string;
  code: string;
  codeDepartement: string;
  codesPostaux: string[];
};

type CadastreFeatureCollection = {
  features: Array<{
    id: string;
    properties: {
      id?: string;
      commune: string;
      prefixe: string;
      code: string;
      contenance?: number;
    };
  }>;
};

type DvfMutationRow = {
  id_mutation: string;
  date_mutation: string;
  valeur_fonciere: string;
  adresse_numero: string;
  adresse_suffixe: string;
  adresse_nom_voie: string;
  code_commune: string;
  nom_commune: string;
  code_departement: string;
  id_parcelle: string;
  type_local: string;
  surface_reelle_bati: string;
  surface_terrain: string;
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`DVF fetch failed (${response.status}): ${url}`);
  }

  return response.json() as Promise<T>;
}

function parseOptionalNumber(value: string | null | undefined): number | null {
  if (!value || value === "None") {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseAddress(
  numero: string,
  suffixe: string,
  voie: string,
): string | null {
  const parts = [numero, suffixe, voie]
    .filter((part) => part && part !== "None")
    .map((part) => part.replace(/\.0$/, ""));

  return parts.length > 0 ? parts.join(" ").trim() : null;
}

function sectionFromParcelId(parcelId: string): string {
  return parcelId.slice(8, 10);
}

function sectionPrefixFromId(sectionId: string): string {
  return sectionId.slice(5, 10);
}

function mapMutationRow(row: DvfMutationRow): DvfSale {
  return {
    mutationId: row.id_mutation,
    parcelId: row.id_parcelle,
    municipalityCode: row.code_commune,
    municipalityName: row.nom_commune,
    departmentCode: row.code_departement,
    section: sectionFromParcelId(row.id_parcelle),
    salePrice: parseOptionalNumber(row.valeur_fonciere) ?? 0,
    saleDate: row.date_mutation,
    address: parseAddress(
      row.adresse_numero,
      row.adresse_suffixe,
      row.adresse_nom_voie,
    ),
    houseAreaM2: parseOptionalNumber(row.surface_reelle_bati),
    plotAreaM2: parseOptionalNumber(row.surface_terrain),
    propertyType: row.type_local,
  };
}

export function normalizePostcodeInput(input: string): {
  kind: "department" | "postal";
  value: string;
} {
  const trimmed = input.trim();

  if (/^\d{5}$/.test(trimmed)) {
    return { kind: "postal", value: trimmed };
  }

  if (/^\d{2,3}$/.test(trimmed)) {
    return { kind: "department", value: trimmed };
  }

  throw new Error(
    "Postcode must be a 5-digit code postal or a 2–3 digit department code",
  );
}

export async function getMunicipalities(
  postcode: string,
): Promise<Municipality[]> {
  const { kind, value } = normalizePostcodeInput(postcode);

  const url =
    kind === "postal"
      ? `${GEO_API_BASE}/communes?codePostal=${value}`
      : `${GEO_API_BASE}/communes?codeDepartement=${value}`;

  const communes = await fetchJson<GeoCommune[]>(url);

  return communes.map((commune) => ({
    code: commune.code,
    name: commune.nom,
    departmentCode: commune.codeDepartement,
    postcodes: commune.codesPostaux,
  }));
}

export async function getSections(
  municipalityCode: string,
): Promise<CadastreSection[]> {
  const data = await fetchJson<CadastreFeatureCollection>(
    `${CADASTRE_BASE}/${municipalityCode}/geojson/sections`,
  );

  return data.features.map((feature) => ({
    id: feature.id,
    code: feature.properties.code,
    prefix: feature.properties.prefixe,
    apiPrefix: sectionPrefixFromId(feature.id),
  }));
}

export async function getSales(
  municipalityCode: string,
  sectionPrefix: string,
): Promise<DvfSale[]> {
  const data = await fetchJson<{ mutations: DvfMutationRow[] }>(
    `${DVF_API_BASE}/mutations3/${municipalityCode}/${sectionPrefix}`,
  );

  return data.mutations
    .filter((row) => row.type_local === "Maison")
    .map(mapMutationRow);
}

export async function getParcels(
  municipalityCode: string,
): Promise<CadastreParcel[]> {
  const [sections, parcelLayer] = await Promise.all([
    getSections(municipalityCode),
    fetchJson<CadastreFeatureCollection>(
      `${CADASTRE_BASE}/${municipalityCode}/geojson/parcelles`,
    ),
  ]);

  const parcelAreas = new Map<string, number | null>();
  for (const feature of parcelLayer.features) {
    parcelAreas.set(
      feature.id,
      parseOptionalNumber(String(feature.properties.contenance ?? "")),
    );
  }

  const houseParcelIds = new Set<string>();

  for (const section of sections) {
    const sales = await getSales(municipalityCode, section.apiPrefix);
    for (const sale of sales) {
      houseParcelIds.add(sale.parcelId);
    }
  }

  return [...houseParcelIds]
    .sort()
    .map((parcelId) => ({
      id: parcelId,
      municipalityCode,
      section: sectionFromParcelId(parcelId),
      number: parcelId.slice(10),
      areaM2: parcelAreas.get(parcelId) ?? null,
    }));
}

export async function getDepartmentName(
  departmentCode: string,
): Promise<string> {
  const department = await fetchJson<{ nom: string }>(
    `${GEO_API_BASE}/departements/${departmentCode}`,
  );
  return department.nom;
}

export function dedupeSalesByParcel(sales: DvfSale[]): DvfSale[] {
  const latestByParcel = new Map<string, DvfSale>();

  for (const sale of sales) {
    const existing = latestByParcel.get(sale.parcelId);
    if (!existing || sale.saleDate > existing.saleDate) {
      latestByParcel.set(sale.parcelId, sale);
    }
  }

  return [...latestByParcel.values()].sort((a, b) =>
    a.parcelId.localeCompare(b.parcelId),
  );
}

export async function collectHouseSalesForMunicipality(
  municipalityCode: string,
): Promise<DvfSale[]> {
  const sections = await getSections(municipalityCode);
  const sales: DvfSale[] = [];

  for (const section of sections) {
    const sectionSales = await getSales(municipalityCode, section.apiPrefix);
    sales.push(...sectionSales);
  }

  return dedupeSalesByParcel(sales);
}
