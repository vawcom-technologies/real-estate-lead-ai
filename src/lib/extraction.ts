import { prisma } from "@/lib/prisma";
import {
  collectHouseSalesForMunicipality,
  dedupeSalesByParcel,
  getDepartmentName,
  getMunicipalities,
  getParcels,
  getSales,
  type DvfSale,
} from "@/lib/dvf";

const MIN_PLOT_AREA_M2 = 80;

export type ExtractionResult = {
  campaignId: string;
  municipalities: number;
  parcelsStored: number;
};

function passesCampaignFilters(sale: DvfSale, minPrice: number): boolean {
  const plotArea = sale.plotAreaM2 ?? 0;
  return sale.salePrice >= minPrice && plotArea >= MIN_PLOT_AREA_M2;
}

async function storeSales(
  campaignId: string,
  departmentLabel: string,
  sales: DvfSale[],
) {
  if (sales.length === 0) {
    return 0;
  }

  await prisma.parcel.createMany({
    data: sales.map((sale) => ({
      campaign_id: campaignId,
      department: departmentLabel,
      municipality: sale.municipalityName,
      section: sale.section,
      parcel_number: sale.parcelId,
      sale_price: sale.salePrice,
      sale_date: new Date(sale.saleDate),
      address: sale.address,
      house_area: sale.houseAreaM2,
      plot_area: sale.plotAreaM2,
    })),
  });

  return sales.length;
}

export async function runExtraction(
  campaignId: string,
): Promise<ExtractionResult> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  await prisma.parcel.deleteMany({
    where: { campaign_id: campaignId },
  });

  const municipalities = await getMunicipalities(campaign.postcode);
  const minPrice = Number(campaign.min_price);
  let parcelsStored = 0;

  const departmentCodes = [
    ...new Set(municipalities.map((m) => m.departmentCode)),
  ];
  const departmentNames = new Map<string, string>();
  for (const code of departmentCodes) {
    const name = await getDepartmentName(code);
    departmentNames.set(code, `${code} - ${name}`);
  }

  for (const municipality of municipalities) {
    const sales = await collectHouseSalesForMunicipality(municipality.code);
    const filtered = dedupeSalesByParcel(sales).filter((sale) =>
      passesCampaignFilters(sale, minPrice),
    );

    parcelsStored += await storeSales(
      campaignId,
      departmentNames.get(municipality.departmentCode) ??
        municipality.departmentCode,
      filtered,
    );
  }

  return {
    campaignId,
    municipalities: municipalities.length,
    parcelsStored,
  };
}

/** @deprecated Use enqueueCampaignJob + worker instead */
export async function extractCampaign(campaignId: string) {
  const { processCampaignJob } = await import("@/lib/campaign-processor");
  return processCampaignJob(campaignId);
}

export {
  getMunicipalities,
  getParcels,
  getSales,
  collectHouseSalesForMunicipality,
};
