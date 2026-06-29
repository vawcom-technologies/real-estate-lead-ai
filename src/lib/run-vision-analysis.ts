import { prisma } from "@/lib/prisma";
import type { Grade } from "@/lib/scoring";
import {
  analyzePropertyImage,
  isVisionAnalysisEnabled,
} from "@/lib/vision-analysis";

export type VisionAnalysisRunResult = {
  campaignId: string;
  analyzed: number;
  skippedNoImage: number;
  skippedNoApiKey: number;
  failed: number;
  grades: Record<Grade, number>;
};

export async function runVisionAnalysis(
  campaignId: string,
): Promise<VisionAnalysisRunResult> {
  const parcels = await prisma.parcel.findMany({
    where: { campaign_id: campaignId },
  });

  const grades: Record<Grade, number> = { A: 0, B: 0, C: 0 };

  if (!isVisionAnalysisEnabled()) {
    for (const parcel of parcels) {
      const grade = parcel.grade as Grade | null;
      if (grade === "A" || grade === "B" || grade === "C") {
        grades[grade] += 1;
      }
    }

    return {
      campaignId,
      analyzed: 0,
      skippedNoImage: 0,
      skippedNoApiKey: parcels.length,
      failed: 0,
      grades,
    };
  }

  let analyzed = 0;
  let skippedNoImage = 0;
  let failed = 0;

  for (const parcel of parcels) {
    try {
      const result = await analyzePropertyImage(parcel.parcel_number);

      await prisma.parcel.update({
        where: { id: parcel.id },
        data: {
          grade: result.grade,
          reason: result.reason,
          analysis: result.analysis,
        },
      });

      grades[result.grade] += 1;
      analyzed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes("Property image not found")) {
        skippedNoImage += 1;
        const grade = parcel.grade as Grade | null;
        if (grade === "A" || grade === "B" || grade === "C") {
          grades[grade] += 1;
        }
        continue;
      }

      failed += 1;
      const grade = parcel.grade as Grade | null;
      if (grade === "A" || grade === "B" || grade === "C") {
        grades[grade] += 1;
      }

      console.warn(
        `Vision analysis failed for ${parcel.parcel_number}: ${message}`,
      );
    }
  }

  return {
    campaignId,
    analyzed,
    skippedNoImage,
    skippedNoApiKey: 0,
    failed,
    grades,
  };
}
