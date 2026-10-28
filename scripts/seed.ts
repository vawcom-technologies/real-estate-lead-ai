import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { saveCampaignExcel } from "../src/lib/campaign-export";
import { CAMPAIGN_STAGE, CAMPAIGN_STATUS } from "../src/lib/campaign-status";
import { prisma } from "../src/lib/prisma";

type DemoParcel = {
  department: string;
  municipality: string;
  section: string;
  parcel_number: string;
  sale_price: number;
  sale_date: Date;
  address: string;
  house_area: number;
  plot_area: number;
  grade: "A" | "B" | "C";
  reason: string;
  analysis: string;
  lat: number;
  lon: number;
};

function daysAgo(days: number, hours = 10): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, 15, 0, 0);
  return date;
}

function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60 * 1000);
}

function analysis(input: {
  ai: boolean;
  backyard: string;
  slope: string;
  vegetation: string;
  feasibility: "high" | "moderate" | "low";
  summary: string;
}): string {
  return JSON.stringify({
    source: input.ai ? "vision-ai" : "site-rules",
    model: input.ai ? "gpt-4o-mini" : undefined,
    free_backyard_area: input.backyard,
    terrain_slope: input.slope,
    vegetation_density: input.vegetation,
    terrace_feasibility: input.feasibility,
    summary: input.summary,
  });
}

const MEDOC: DemoParcel[] = [
  {
    department: "33 - Gironde",
    municipality: "Le Pian-Médoc",
    section: "AI",
    parcel_number: "33322000AI0234",
    sale_price: 466150,
    sale_date: new Date("2024-06-15"),
    address: "153 Allée Montesquieu",
    house_area: 128,
    plot_area: 2177,
    grade: "A",
    reason:
      "Large rear parcel; Limited existing terrace; Detached house; Easy garden access",
    analysis: analysis({
      ai: true,
      backyard: "About 1,800 m² of open lawn behind the house",
      slope: "Flat",
      vegetation: "Sparse",
      feasibility: "high",
      summary: "Strong terrace conversion opportunity on a large, open plot.",
    }),
    lat: 44.9552,
    lon: -0.6681,
  },
  {
    department: "33 - Gironde",
    municipality: "Le Pian-Médoc",
    section: "AI",
    parcel_number: "33322000AI0027",
    sale_price: 512000,
    sale_date: new Date("2025-03-17"),
    address: "551 Allée Saint-Seurin",
    house_area: 142,
    plot_area: 1890,
    grade: "A",
    reason: "Wide south garden; Few trees; Flat ground; Clear access from the living room",
    analysis: analysis({
      ai: true,
      backyard: "Broad lawn, roughly 1,400 m² usable",
      slope: "Flat",
      vegetation: "Sparse",
      feasibility: "high",
      summary: "High-value sale with a clear terrace footprint.",
    }),
    lat: 44.9584,
    lon: -0.6712,
  },
  {
    department: "33 - Gironde",
    municipality: "Ludon-Médoc",
    section: "AC",
    parcel_number: "33256000AC0142",
    sale_price: 438000,
    sale_date: new Date("2024-09-08"),
    address: "12 Rue du Maréchal Joffre",
    house_area: 116,
    plot_area: 1240,
    grade: "A",
    reason: "Detached house; Open rear lawn; Light vegetation; Level site",
    analysis: analysis({
      ai: true,
      backyard: "Open rear lawn of about 900 m²",
      slope: "Flat",
      vegetation: "Sparse",
      feasibility: "high",
      summary: "Straightforward terrace site on a recent family-house sale.",
    }),
    lat: 44.9821,
    lon: -0.6914,
  },
  {
    department: "33 - Gironde",
    municipality: "Ludon-Médoc",
    section: "AB",
    parcel_number: "33256000AB0064",
    sale_price: 389500,
    sale_date: new Date("2025-01-21"),
    address: "8 Impasse des Chênes",
    house_area: 104,
    plot_area: 980,
    grade: "A",
    reason: "Large side and rear garden; Few obstacles; Easy access from the house",
    analysis: analysis({
      ai: true,
      backyard: "Combined side and rear garden, about 750 m²",
      slope: "Gentle",
      vegetation: "Sparse",
      feasibility: "high",
      summary: "Quiet close with room for a generous terrace.",
    }),
    lat: 44.9796,
    lon: -0.6877,
  },
  {
    department: "33 - Gironde",
    municipality: "Blanquefort",
    section: "BH",
    parcel_number: "33056000BH0088",
    sale_price: 365000,
    sale_date: new Date("2024-11-22"),
    address: "18 Avenue de la République",
    house_area: 98,
    plot_area: 760,
    grade: "B",
    reason: "Good outdoor space; Some mature trees; Minor level change",
    analysis: analysis({
      ai: true,
      backyard: "Usable garden of about 500 m², partly shaded",
      slope: "Gentle",
      vegetation: "Moderate",
      feasibility: "moderate",
      summary: "Possible terrace if the shaded edge is kept clear.",
    }),
    lat: 44.9108,
    lon: -0.6365,
  },
  {
    department: "33 - Gironde",
    municipality: "Parempuyre",
    section: "ZE",
    parcel_number: "33312000ZE0031",
    sale_price: 342000,
    sale_date: new Date("2025-02-14"),
    address: "27 Chemin de Canteloup",
    house_area: 110,
    plot_area: 860,
    grade: "B",
    reason: "Useful rear garden; Some vegetation; Access from the kitchen",
    analysis: analysis({
      ai: false,
      backyard: "Rear garden around 600 m²",
      slope: "Gentle",
      vegetation: "Moderate",
      feasibility: "moderate",
      summary: "Solid candidate after a short site check.",
    }),
    lat: 44.9472,
    lon: -0.6418,
  },
  {
    department: "33 - Gironde",
    municipality: "Le Taillan-Médoc",
    section: "OC",
    parcel_number: "33519000OC0119",
    sale_price: 418000,
    sale_date: new Date("2024-08-03"),
    address: "4 Allée du Parc",
    house_area: 132,
    plot_area: 1105,
    grade: "B",
    reason: "Good plot depth; A few trees along the boundary; Mostly level",
    analysis: analysis({
      ai: true,
      backyard: "Deep garden, about 800 m², trees on the west edge",
      slope: "Flat",
      vegetation: "Moderate",
      feasibility: "moderate",
      summary: "Depth is there; the tree line should stay outside the terrace.",
    }),
    lat: 44.9044,
    lon: -0.6789,
  },
  {
    department: "33 - Gironde",
    municipality: "Eysines",
    section: "AD",
    parcel_number: "33162000AD0042",
    sale_price: 298000,
    sale_date: new Date("2023-12-11"),
    address: "41 Rue Jules Ferry",
    house_area: 86,
    plot_area: 420,
    grade: "C",
    reason: "Limited rear space; Heavy boundary planting; Tight access",
    analysis: analysis({
      ai: false,
      backyard: "Narrow yard, under 250 m²",
      slope: "Gentle",
      vegetation: "Heavy",
      feasibility: "low",
      summary: "Keep on file. Direct outreach is a lower priority.",
    }),
    lat: 44.8856,
    lon: -0.6512,
  },
];

const BORDEAUX: DemoParcel[] = [
  {
    department: "33 - Gironde",
    municipality: "Bordeaux",
    section: "CK",
    parcel_number: "33063000CK0218",
    sale_price: 785000,
    sale_date: new Date("2025-04-02"),
    address: "16 Rue du Jardin Public",
    house_area: 168,
    plot_area: 640,
    grade: "A",
    reason: "Private rear court; Clear of structures; Level stone terrace base",
    analysis: analysis({
      ai: true,
      backyard: "Private court of about 280 m², mostly open",
      slope: "Flat",
      vegetation: "Sparse",
      feasibility: "high",
      summary: "High sale price and a clear outdoor room behind the house.",
    }),
    lat: 44.8486,
    lon: -0.5784,
  },
  {
    department: "33 - Gironde",
    municipality: "Le Bouscat",
    section: "AE",
    parcel_number: "33069000AE0077",
    sale_price: 692000,
    sale_date: new Date("2024-10-19"),
    address: "9 Avenue de la Libération",
    house_area: 154,
    plot_area: 890,
    grade: "A",
    reason: "Detached villa; Wide lawn; Few trees; Direct garden doors",
    analysis: analysis({
      ai: true,
      backyard: "Lawn of roughly 600 m² facing south",
      slope: "Flat",
      vegetation: "Sparse",
      feasibility: "high",
      summary: "A strong postcard property in the inner suburbs.",
    }),
    lat: 44.8652,
    lon: -0.5991,
  },
  {
    department: "33 - Gironde",
    municipality: "Caudéran",
    section: "BM",
    parcel_number: "33063000BM0155",
    sale_price: 640000,
    sale_date: new Date("2025-01-09"),
    address: "22 Rue Medo",
    house_area: 146,
    plot_area: 720,
    grade: "B",
    reason: "Good garden depth; Some shrubs; Minor steps from the house",
    analysis: analysis({
      ai: true,
      backyard: "Garden around 450 m² with a planted edge",
      slope: "Gentle",
      vegetation: "Moderate",
      feasibility: "moderate",
      summary: "Worth a tailored outdoor proposal.",
    }),
    lat: 44.8533,
    lon: -0.6238,
  },
  {
    department: "33 - Gironde",
    municipality: "Bruges",
    section: "AK",
    parcel_number: "33075000AK0091",
    sale_price: 455000,
    sale_date: new Date("2024-07-28"),
    address: "5 Impasse des Acacias",
    house_area: 112,
    plot_area: 680,
    grade: "B",
    reason: "Usable rear lawn; Moderate planting; Level overall",
    analysis: analysis({
      ai: false,
      backyard: "Rear lawn near 450 m²",
      slope: "Flat",
      vegetation: "Moderate",
      feasibility: "moderate",
      summary: "A steady suburban opportunity.",
    }),
    lat: 44.8827,
    lon: -0.6124,
  },
  {
    department: "33 - Gironde",
    municipality: "Bègles",
    section: "DZ",
    parcel_number: "33039000DZ0036",
    sale_price: 410000,
    sale_date: new Date("2024-05-16"),
    address: "14 Rue Camille Pelletan",
    house_area: 96,
    plot_area: 390,
    grade: "C",
    reason: "Small yard; Outbuildings take space; Limited extension room",
    analysis: analysis({
      ai: false,
      backyard: "Compact yard under 200 m²",
      slope: "Flat",
      vegetation: "Moderate",
      feasibility: "low",
      summary: "Lower priority than the detached houses in this search.",
    }),
    lat: 44.8089,
    lon: -0.5486,
  },
];

const COAST: DemoParcel[] = [
  {
    department: "64 - Pyrénées-Atlantiques",
    municipality: "Biarritz",
    section: "AH",
    parcel_number: "64122000AH0184",
    sale_price: 890000,
    sale_date: new Date("2025-02-27"),
    address: "11 Avenue de la Marne",
    house_area: 160,
    plot_area: 980,
    grade: "A",
    reason: "Detached house; Open garden; Flat lawn; Strong sale value",
    analysis: analysis({
      ai: true,
      backyard: "Open garden around 700 m²",
      slope: "Gentle",
      vegetation: "Sparse",
      feasibility: "high",
      summary: "Coastal sale with a clear outdoor living opportunity.",
    }),
    lat: 43.4718,
    lon: -1.5584,
  },
  {
    department: "64 - Pyrénées-Atlantiques",
    municipality: "Anglet",
    section: "BC",
    parcel_number: "64024000BC0062",
    sale_price: 735000,
    sale_date: new Date("2024-12-05"),
    address: "28 Rue des Barthes",
    house_area: 138,
    plot_area: 1120,
    grade: "A",
    reason: "Large plot; Few trees in the centre; Easy access from the house",
    analysis: analysis({
      ai: true,
      backyard: "Central lawn of about 800 m²",
      slope: "Flat",
      vegetation: "Sparse",
      feasibility: "high",
      summary: "One of the stronger coastal leads.",
    }),
    lat: 43.4894,
    lon: -1.5186,
  },
  {
    department: "64 - Pyrénées-Atlantiques",
    municipality: "Bayonne",
    section: "EV",
    parcel_number: "64102000EV0048",
    sale_price: 548000,
    sale_date: new Date("2024-09-30"),
    address: "6 Chemin de Lahonce",
    house_area: 124,
    plot_area: 840,
    grade: "B",
    reason: "Good space; Some hedges; Slight fall toward the boundary",
    analysis: analysis({
      ai: true,
      backyard: "Garden near 550 m² with a hedge line",
      slope: "Gentle",
      vegetation: "Moderate",
      feasibility: "moderate",
      summary: "Promising if the terrace stays on the level portion.",
    }),
    lat: 43.4922,
    lon: -1.4618,
  },
  {
    department: "64 - Pyrénées-Atlantiques",
    municipality: "Bidart",
    section: "ZI",
    parcel_number: "64125000ZI0019",
    sale_price: 615000,
    sale_date: new Date("2025-03-04"),
    address: "3 Lotissement Erretegia",
    house_area: 118,
    plot_area: 560,
    grade: "B",
    reason: "Comfortable garden; Planted edges; House sits centrally",
    analysis: analysis({
      ai: false,
      backyard: "Garden around 350 m²",
      slope: "Gentle",
      vegetation: "Moderate",
      feasibility: "moderate",
      summary: "A measured upgrade rather than a full conversion.",
    }),
    lat: 43.4386,
    lon: -1.5912,
  },
];

const IN_PROGRESS: DemoParcel[] = [
  {
    department: "33 - Gironde",
    municipality: "Cenon",
    section: "AB",
    parcel_number: "33119000AB0271",
    sale_price: 372000,
    sale_date: new Date("2025-05-12"),
    address: "19 Rue Pasteur",
    house_area: 108,
    plot_area: 690,
    grade: "A",
    reason: "Open rear garden; Light planting; Level approach from the house",
    analysis: analysis({
      ai: true,
      backyard: "Rear garden about 480 m²",
      slope: "Flat",
      vegetation: "Sparse",
      feasibility: "high",
      summary: "Imagery is still being prepared for this lead.",
    }),
    lat: 44.8571,
    lon: -0.5314,
  },
  {
    department: "33 - Gironde",
    municipality: "Floirac",
    section: "CD",
    parcel_number: "33167000CD0083",
    sale_price: 334000,
    sale_date: new Date("2025-04-18"),
    address: "7 Avenue du Général de Gaulle",
    house_area: 101,
    plot_area: 610,
    grade: "B",
    reason: "Decent garden; Some trees; Minor obstacles near the boundary",
    analysis: analysis({
      ai: false,
      backyard: "Garden around 400 m²",
      slope: "Gentle",
      vegetation: "Moderate",
      feasibility: "moderate",
      summary: "Scored, waiting on marketing visuals.",
    }),
    lat: 44.8368,
    lon: -0.5247,
  },
  {
    department: "33 - Gironde",
    municipality: "Lormont",
    section: "BE",
    parcel_number: "33249000BE0156",
    sale_price: 289000,
    sale_date: new Date("2024-11-02"),
    address: "33 Rue de la République",
    house_area: 92,
    plot_area: 480,
    grade: "B",
    reason: "Usable yard; Moderate vegetation; Access from the ground floor",
    analysis: analysis({
      ai: false,
      backyard: "Yard near 300 m²",
      slope: "Gentle",
      vegetation: "Moderate",
      feasibility: "moderate",
      summary: "Included while visuals are generated.",
    }),
    lat: 44.8794,
    lon: -0.5216,
  },
];

async function saveAerial(parcel: DemoParcel): Promise<void> {
  const delta = 0.00042;
  const bbox = [
    parcel.lat - delta,
    parcel.lon - delta,
    parcel.lat + delta,
    parcel.lon + delta,
  ].join(",");
  const url =
    "https://data.geopf.fr/wms-r/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap" +
    "&LAYERS=HR.ORTHOIMAGERY.ORTHOPHOTOS&STYLES=&CRS=EPSG:4326" +
    `&BBOX=${bbox}&WIDTH=640&HEIGHT=400&FORMAT=image/jpeg`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Imagery skipped for ${parcel.parcel_number}: ${message}`);
    return;
  }
  if (!response.ok) return;
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 8_000 || buffer[0] !== 0xff) return;

  const safe = parcel.parcel_number.replace(/[^a-zA-Z0-9_-]/g, "_");
  const dir = path.join(process.cwd(), "property-images");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${safe}.jpg`), buffer);
  await writeFile(path.join(dir, `${safe}_after.jpg`), buffer);
}

function withoutLocation(parcel: DemoParcel) {
  const { lat: _lat, lon: _lon, ...record } = parcel;
  return record;
}

async function main() {
  await prisma.parcel.deleteMany();
  await prisma.campaign.deleteMany();

  const completed = await prisma.campaign.create({
    data: {
      postcode: "33290",
      min_price: 250000,
      agent_name: "Marie Dupont",
      agent_phone: "+33 6 12 34 56 78",
      agent_email: "marie.dupont@lisiere.fr",
      status: CAMPAIGN_STATUS.completed,
      stage: CAMPAIGN_STAGE.done,
      created_at: daysAgo(2, 9),
      parcels: { create: MEDOC.map(withoutLocation) },
    },
    include: { parcels: true },
  });

  const bordeaux = await prisma.campaign.create({
    data: {
      postcode: "33000",
      min_price: 400000,
      agent_name: "Camille Laurent",
      agent_phone: "+33 6 45 67 89 10",
      agent_email: "camille.laurent@lisiere.fr",
      status: CAMPAIGN_STATUS.completed,
      stage: CAMPAIGN_STAGE.done,
      created_at: daysAgo(6, 14),
      parcels: { create: BORDEAUX.map(withoutLocation) },
    },
    include: { parcels: true },
  });

  const coast = await prisma.campaign.create({
    data: {
      postcode: "64200",
      min_price: 500000,
      agent_name: "Lucas Petit",
      agent_phone: "+33 6 55 44 33 22",
      agent_email: "lucas.petit@lisiere.fr",
      status: CAMPAIGN_STATUS.completed,
      stage: CAMPAIGN_STAGE.done,
      created_at: daysAgo(12, 11),
      parcels: { create: COAST.map(withoutLocation) },
    },
    include: { parcels: true },
  });

  await prisma.campaign.create({
    data: {
      postcode: "33150",
      min_price: 280000,
      agent_name: "Sophie Bernard",
      agent_phone: "+33 6 11 22 33 44",
      agent_email: "sophie.bernard@lisiere.fr",
      status: CAMPAIGN_STATUS.running,
      stage: CAMPAIGN_STAGE.visuals,
      created_at: minutesAgo(40),
      parcels: { create: IN_PROGRESS.map(withoutLocation) },
    },
  });

  await Promise.all([
    saveCampaignExcel(completed.id, completed.parcels),
    saveCampaignExcel(bordeaux.id, bordeaux.parcels),
    saveCampaignExcel(coast.id, coast.parcels),
  ]);

  const imagery = [...MEDOC, ...BORDEAUX, ...COAST, ...IN_PROGRESS];
  const queue = [...imagery];
  async function pullAerial() {
    while (queue.length > 0) {
      const parcel = queue.shift();
      if (!parcel) return;
      await saveAerial(parcel);
    }
  }
  await Promise.all(Array.from({ length: 4 }, () => pullAerial()));

  console.log("Demo workspace ready.");
  console.log(`  33290 · Marie Dupont · ${completed.parcels.length} properties`);
  console.log(`  33000 · Camille Laurent · ${bordeaux.parcels.length} properties`);
  console.log(`  64200 · Lucas Petit · ${coast.parcels.length} properties`);
  console.log("  33150 · Sophie Bernard · analysis in progress");
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
