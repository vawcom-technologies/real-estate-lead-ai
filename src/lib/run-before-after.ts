import { access } from "node:fs/promises";
import {
  generateAfterImage,
  isImageGenerationEnabled,
} from "@/lib/image-generation";
import { prisma } from "@/lib/prisma";
import { getPropertyImagePath } from "@/lib/satellite-imagery";
import { getAfterImagePath } from "@/lib/storage";

export type BeforeAfterRunResult = {
  campaignId: string;
  generated: number;
  skippedCached: number;
  skippedNoImage: number;
  skippedNoApiKey: number;
  failed: number;
};

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function runBeforeAfterGeneration(
  campaignId: string,
): Promise<BeforeAfterRunResult> {
  const parcels = await prisma.parcel.findMany({
    where: { campaign_id: campaignId },
    select: { parcel_number: true },
  });

  if (!isImageGenerationEnabled()) {
    return {
      campaignId,
      generated: 0,
      skippedCached: 0,
      skippedNoImage: 0,
      skippedNoApiKey: parcels.length,
      failed: 0,
    };
  }

  let generated = 0;
  let skippedCached = 0;
  let skippedNoImage = 0;
  let failed = 0;

  for (const parcel of parcels) {
    const parcelId = parcel.parcel_number;

    try {
      if (!(await fileExists(getPropertyImagePath(parcelId)))) {
        skippedNoImage += 1;
        continue;
      }

      if (await fileExists(getAfterImagePath(parcelId))) {
        skippedCached += 1;
        continue;
      }

      const result = await generateAfterImage(parcelId);
      if (result.model === "cached") {
        skippedCached += 1;
      } else {
        generated += 1;
      }
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `Before/after generation failed for ${parcelId}: ${message}`,
      );
    }
  }

  return {
    campaignId,
    generated,
    skippedCached,
    skippedNoImage,
    skippedNoApiKey: 0,
    failed,
  };
}
