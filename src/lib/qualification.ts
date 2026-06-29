import { validateResidentialAddress } from "@/lib/address-validation";
import { prisma } from "@/lib/prisma";

export type QualificationResult = {
  campaignId: string;
  kept: number;
  rejected: number;
};

export async function runQualification(
  campaignId: string,
): Promise<QualificationResult> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  const parcels = await prisma.parcel.findMany({
    where: { campaign_id: campaignId },
  });

  const rejectedIds: string[] = [];

  for (const parcel of parcels) {
    const result = await validateResidentialAddress({
      address: parcel.address,
      municipality: parcel.municipality,
      postcode: campaign.postcode,
    });

    if (!result.valid) {
      rejectedIds.push(parcel.id);
    }
  }

  if (rejectedIds.length > 0) {
    await prisma.parcel.deleteMany({
      where: { id: { in: rejectedIds } },
    });
  }

  return {
    campaignId,
    kept: parcels.length - rejectedIds.length,
    rejected: rejectedIds.length,
  };
}
