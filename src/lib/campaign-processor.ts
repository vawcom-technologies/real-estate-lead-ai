import { saveCampaignExcel } from "@/lib/campaign-export";
import { CAMPAIGN_STATUS } from "@/lib/campaign-status";
import { runExtraction } from "@/lib/extraction";
import { generateMarketingPackage } from "@/lib/marketing-export";
import { prisma } from "@/lib/prisma";
import { runImageryRetrieval } from "@/lib/imagery-retrieval";
import { runQualification } from "@/lib/qualification";
import { runScoring } from "@/lib/run-scoring";
import { runVisionAnalysis } from "@/lib/run-vision-analysis";

export async function processCampaignJob(campaignId: string) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CAMPAIGN_STATUS.running },
    });

    const extraction = await runExtraction(campaignId);
    const qualification = await runQualification(campaignId);
    const imagery = await runImageryRetrieval(campaignId);
    await runScoring(campaignId);
    const vision = await runVisionAnalysis(campaignId);

    const parcels = await prisma.parcel.findMany({
      where: { campaign_id: campaignId },
      orderBy: [{ municipality: "asc" }, { parcel_number: "asc" }],
    });

    await saveCampaignExcel(campaignId, parcels);
    const marketing = await generateMarketingPackage(campaignId);

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CAMPAIGN_STATUS.completed },
    });

    return {
      ...extraction,
      parcelsStored: qualification.kept,
      parcelsRejected: qualification.rejected,
      imagesRetrieved: imagery.retrieved,
      imagesSkipped: imagery.skipped,
      imagesFailed: imagery.failed,
      visionAnalyzed: vision.analyzed,
      visionSkippedNoImage: vision.skippedNoImage,
      visionSkippedNoApiKey: vision.skippedNoApiKey,
      visionFailed: vision.failed,
      grades: vision.grades,
      marketingPostcards: marketing.postcards,
      marketingReports: marketing.reports,
      marketingImages: marketing.images,
    };
  } catch (error) {
    await prisma.campaign
      .update({
        where: { id: campaignId },
        data: { status: CAMPAIGN_STATUS.failed },
      })
      .catch(() => undefined);
    throw error;
  }
}
