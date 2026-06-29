import { fetchParcelEnvironment, fetchParcelSlopePercent } from "@/lib/parcel-environment";
import { getParcelGeometry } from "@/lib/parcel-geometry";
import { prisma } from "@/lib/prisma";
import { scoreParcel, type Grade } from "@/lib/scoring";

export type ScoringRunResult = {
  campaignId: string;
  scored: number;
  grades: Record<Grade, number>;
};

function toNumber(
  value: { toString(): string } | number | null | undefined,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : null;
}

export async function scoreParcelRecord(parcel: {
  parcel_number: string;
  plot_area: { toString(): string } | number | null;
  house_area: { toString(): string } | number | null;
}) {
  const { bbox } = await getParcelGeometry(parcel.parcel_number, {
    paddingRatio: 0,
  });

  const [environment, slopePercent] = await Promise.all([
    fetchParcelEnvironment(bbox),
    fetchParcelSlopePercent(bbox),
  ]);

  return scoreParcel({
    plotAreaM2: toNumber(parcel.plot_area),
    houseAreaM2: toNumber(parcel.house_area),
    vegetationFeatureCount: environment.vegetationFeatureCount,
    hasPool: environment.hasPool,
    slopePercent,
  });
}

export async function runScoring(campaignId: string): Promise<ScoringRunResult> {
  const parcels = await prisma.parcel.findMany({
    where: { campaign_id: campaignId },
  });

  const grades: Record<Grade, number> = { A: 0, B: 0, C: 0 };

  for (const parcel of parcels) {
    try {
      const result = await scoreParcelRecord(parcel);

      await prisma.parcel.update({
        where: { id: parcel.id },
        data: {
          grade: result.grade,
          reason: result.reason,
        },
      });

      grades[result.grade] += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Scoring failed for ${parcel.parcel_number}: ${message}`);
    }
  }

  return {
    campaignId,
    scored: parcels.length,
    grades,
  };
}
