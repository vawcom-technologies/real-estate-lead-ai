import { CAMPAIGN_STAGE, CAMPAIGN_STATUS } from "@/lib/campaign-status";
import { getWorkspaceCampaign } from "@/lib/demo-workspace";

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
  const parcels = getWorkspaceCampaign(campaignId)?.parcels ?? [];

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
    label: "Data extraction",
    description: "Recent house sales and the price floor",
    stage: CAMPAIGN_STAGE.extracting,
  },
  {
    id: "analyzing",
    label: "Property intelligence",
    description: "Residential checks, parcels, imagery, and scoring",
    stage: CAMPAIGN_STAGE.analyzing,
  },
  {
    id: "visuals",
    label: "Visual analysis",
    description: "Satellite photos and terrace visualizations",
    stage: CAMPAIGN_STAGE.visuals,
  },
  {
    id: "postcards",
    label: "Marketing assets",
    description: "Postcards and property reports",
    stage: CAMPAIGN_STAGE.postcards,
  },
  {
    id: "packaging",
    label: "Campaign package",
    description: "Spreadsheet, imagery, and the marketing kit",
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
