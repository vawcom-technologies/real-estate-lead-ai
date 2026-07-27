import { CAMPAIGN_STAGE, CAMPAIGN_STATUS } from "@/lib/campaign-status";
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
    label: "Extracting Parcels",
    description: "DVF house sales, cadastre, price & plot filters",
    stage: CAMPAIGN_STAGE.extracting,
  },
  {
    id: "analyzing",
    label: "Analyzing Properties",
    description: "Address validation, satellite, scoring & vision AI",
    stage: CAMPAIGN_STAGE.analyzing,
  },
  {
    id: "visuals",
    label: "Generating Visuals",
    description: "Before satellite + AI terrace after images",
    stage: CAMPAIGN_STAGE.visuals,
  },
  {
    id: "postcards",
    label: "Creating Postcards",
    description: "BEFORE | AFTER PDFs with value uplift",
    stage: CAMPAIGN_STAGE.postcards,
  },
  {
    id: "packaging",
    label: "Packaging Files",
    description: "Excel, before/after zips, postcards zip",
    stage: CAMPAIGN_STAGE.packaging,
  },
] as const;

const STAGE_ORDER = [
  CAMPAIGN_STAGE.extracting,
  CAMPAIGN_STAGE.analyzing,
  CAMPAIGN_STAGE.visuals,
  CAMPAIGN_STAGE.postcards,
  CAMPAIGN_STAGE.packaging,
  CAMPAIGN_STAGE.done,
] as const;

export function pipelineStepStates(
  status: string,
  stage?: string | null,
): Array<"done" | "active" | "pending" | "failed"> {
  if (status === CAMPAIGN_STATUS.failed) {
    const activeIndex = stage
      ? Math.max(
          0,
          STAGE_ORDER.indexOf(stage as (typeof STAGE_ORDER)[number]),
        )
      : 0;
    return PIPELINE_STEPS.map((_, index) =>
      index < activeIndex ? "done" : index === activeIndex ? "failed" : "pending",
    );
  }

  if (status === CAMPAIGN_STATUS.completed || stage === CAMPAIGN_STAGE.done) {
    return PIPELINE_STEPS.map(() => "done" as const);
  }

  if (status === CAMPAIGN_STATUS.pending) {
    return PIPELINE_STEPS.map(() => "pending" as const);
  }

  if (status === CAMPAIGN_STATUS.running) {
    const current = stage
      ? STAGE_ORDER.indexOf(stage as (typeof STAGE_ORDER)[number])
      : 0;
    const activeIndex = current < 0 ? 0 : Math.min(current, PIPELINE_STEPS.length - 1);

    return PIPELINE_STEPS.map((_, index) => {
      if (index < activeIndex) return "done";
      if (index === activeIndex) return "active";
      return "pending";
    });
  }

  return PIPELINE_STEPS.map(() => "pending" as const);
}
