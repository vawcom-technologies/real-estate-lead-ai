import { CAMPAIGN_STATUS } from "@/lib/campaign-status";
import { prisma } from "@/lib/prisma";

export type GradeCounts = { A: number; B: number; C: number; ungraded: number };

export type CampaignInsights = {
  parcelCount: number;
  grades: GradeCounts;
  withAnalysis: number;
  withGrade: number;
};

export async function getCampaignInsights(
  campaignId: string,
): Promise<CampaignInsights> {
  const parcels = await prisma.parcel.findMany({
    where: { campaign_id: campaignId },
    select: { grade: true, analysis: true },
  });

  const grades: GradeCounts = { A: 0, B: 0, C: 0, ungraded: 0 };

  for (const parcel of parcels) {
    if (parcel.grade === "A") grades.A += 1;
    else if (parcel.grade === "B") grades.B += 1;
    else if (parcel.grade === "C") grades.C += 1;
    else grades.ungraded += 1;
  }

  return {
    parcelCount: parcels.length,
    grades,
    withAnalysis: parcels.filter((p) => p.analysis).length,
    withGrade: parcels.filter((p) => p.grade).length,
  };
}

export const PIPELINE_STEPS = [
  {
    id: "extraction",
    label: "Data Extraction",
    description: "DVF house sales by postcode",
  },
  {
    id: "validation",
    label: "Address Validation",
    description: "BAN, OpenStreetMap, Google Maps",
  },
  {
    id: "imagery",
    label: "Satellite Imagery",
    description: "Google Static Maps or IGN orthophoto",
  },
  {
    id: "scoring",
    label: "Rule Scoring",
    description: "A/B/C grade from plot & environment",
  },
  {
    id: "vision",
    label: "AI Vision",
    description: "Backyard analysis from satellite image",
  },
  {
    id: "marketing",
    label: "Marketing Package",
    description: "Postcards, PDF reports, ZIP export",
  },
] as const;

export function pipelineStepStates(status: string): Array<"done" | "active" | "pending" | "failed"> {
  if (status === CAMPAIGN_STATUS.failed) {
    return ["done", "done", "failed", "pending", "pending", "pending"];
  }

  if (status === CAMPAIGN_STATUS.completed) {
    return PIPELINE_STEPS.map(() => "done" as const);
  }

  if (status === CAMPAIGN_STATUS.running) {
    return ["done", "done", "done", "active", "pending", "pending"];
  }

  if (status === CAMPAIGN_STATUS.pending) {
    return ["pending", "pending", "pending", "pending", "pending", "pending"];
  }

  return PIPELINE_STEPS.map(() => "pending" as const);
}
