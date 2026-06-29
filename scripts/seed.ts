import "dotenv/config";
import { saveCampaignExcel } from "../src/lib/campaign-export";
import { CAMPAIGN_STATUS } from "../src/lib/campaign-status";
import { prisma } from "../src/lib/prisma";

const DEMO_PARCELS = [
  {
    department: "33 - Gironde",
    municipality: "Le Pian-Médoc",
    section: "AI",
    parcel_number: "33322000AI0234",
    sale_price: 466150,
    sale_date: new Date("2022-06-15"),
    address: "153 All Montesquieu",
    house_area: 100,
    plot_area: 2177,
  },
  {
    department: "33 - Gironde",
    municipality: "Le Pian-Médoc",
    section: "AI",
    parcel_number: "33322000AI0027",
    sale_price: 470000,
    sale_date: new Date("2025-03-17"),
    address: "551 All Saint Seurin",
    house_area: 118,
    plot_area: 1890,
  },
  {
    department: "33 - Gironde",
    municipality: "Ludon-Médoc",
    section: "AC",
    parcel_number: "33256000AC0142",
    sale_price: 385000,
    sale_date: new Date("2024-09-08"),
    address: "12 Rue du Maréchal Joffre",
    house_area: 95,
    plot_area: 920,
  },
  {
    department: "33 - Gironde",
    municipality: "Blanquefort",
    section: "BH",
    parcel_number: "33056000BH0088",
    sale_price: 312500,
    sale_date: new Date("2023-11-22"),
    address: "8 Av de la République",
    house_area: 88,
    plot_area: 540,
  },
  {
    department: "33 - Gironde",
    municipality: "Parempuyre",
    section: "ZE",
    parcel_number: "33312000ZE0031",
    sale_price: 298000,
    sale_date: new Date("2024-02-14"),
    address: "27 Chem de Canteloup",
    house_area: 102,
    plot_area: 610,
  },
];

async function main() {
  await prisma.parcel.deleteMany();
  await prisma.campaign.deleteMany();

  const completed = await prisma.campaign.create({
    data: {
      postcode: "33290",
      min_price: 250000,
      agent_name: "Marie Dupont",
      agent_phone: "+33 6 12 34 56 78",
      agent_email: "marie.dupont@thermcross.fr",
      status: CAMPAIGN_STATUS.completed,
      parcels: { create: DEMO_PARCELS },
    },
    include: { parcels: true },
  });

  await saveCampaignExcel(completed.id, completed.parcels);

  await prisma.campaign.create({
    data: {
      postcode: "75001",
      min_price: 250000,
      agent_name: "Jean Martin",
      agent_phone: "+33 6 98 76 54 32",
      agent_email: "jean.martin@thermcross.fr",
      status: CAMPAIGN_STATUS.running,
    },
  });

  await prisma.campaign.create({
    data: {
      postcode: "33000",
      min_price: 300000,
      agent_name: "Sophie Bernard",
      agent_phone: "+33 6 11 22 33 44",
      agent_email: "sophie.bernard@thermcross.fr",
      status: CAMPAIGN_STATUS.pending,
    },
  });

  await prisma.campaign.create({
    data: {
      postcode: "64000",
      min_price: 275000,
      agent_name: "Lucas Petit",
      agent_phone: "+33 6 55 44 33 22",
      agent_email: "lucas.petit@thermcross.fr",
      status: CAMPAIGN_STATUS.failed,
    },
  });

  console.log("Seed complete:\n");
  console.log(`  Completed (5 parcels, Excel ready): ${completed.id}`);
  console.log("    Postcode 33290 · Marie Dupont · Download Excel works");
  console.log("  Running:  75001 · Jean Martin");
  console.log("  Pending:  33000 · Sophie Bernard");
  console.log("  Failed:   64000 · Lucas Petit");
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
