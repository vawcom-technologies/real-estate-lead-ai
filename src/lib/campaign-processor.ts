import { saveCampaignExcel } from "@/lib/campaign-export";
import { CAMPAIGN_STAGE, CAMPAIGN_STATUS } from "@/lib/campaign-status";
import { runExtraction } from "@/lib/extraction";
import { generateMarketingPackage } from "@/lib/marketing-export";
import { prisma } from "@/lib/prisma";
import { runBeforeAfterGeneration } from "@/lib/run-before-after";
import { runImageryRetrieval } from "@/lib/imagery-retrieval";
import { runQualification } from "@/lib/qualification";
import { runScoring } from "@/lib/run-scoring";
import { runVisionAnalysis } from "@/lib/run-vision-analysis";

async function setStage(campaignId: string, stage: string) {
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { stage },
  });
}

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
      data: {
        status: CAMPAIGN_STATUS.running,
        stage: CAMPAIGN_STAGE.extracting,
      },
    });

    const extraction = await runExtraction(campaignId);

    await setStage(campaignId, CAMPAIGN_STAGE.analyzing);
    const qualification = await runQualification(campaignId);
    const imagery = await runImageryRetrieval(campaignId);
    await runScoring(campaignId);
    const vision = await runVisionAnalysis(campaignId);

    await setStage(campaignId, CAMPAIGN_STAGE.visuals);
    const visuals = await runBeforeAfterGeneration(campaignId);

    const parcels = await prisma.parcel.findMany({
      where: { campaign_id: campaignId },
      orderBy: [{ municipality: "asc" }, { parcel_number: "asc" }],
    });

    await saveCampaignExcel(campaignId, parcels);

    await setStage(campaignId, CAMPAIGN_STAGE.postcards);
    const marketing = await generateMarketingPackage(campaignId);

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: CAMPAIGN_STATUS.completed,
        stage: CAMPAIGN_STAGE.done,
      },
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
      afterImagesGenerated: visuals.generated,
      afterImagesCached: visuals.skippedCached,
      afterImagesSkippedNoImage: visuals.skippedNoImage,
      afterImagesSkippedNoApiKey: visuals.skippedNoApiKey,
      afterImagesFailed: visuals.failed,
      marketingPostcards: marketing.postcards,
      marketingReports: marketing.reports,
      marketingBeforeImages: marketing.beforeImages,
      marketingAfterImages: marketing.afterImages,
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
