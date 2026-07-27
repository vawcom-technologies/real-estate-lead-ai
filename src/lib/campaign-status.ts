export const CAMPAIGN_STATUS = {
  pending: "pending",
  running: "running",
  completed: "completed",
  failed: "failed",
} as const;

export type CampaignStatus =
  (typeof CAMPAIGN_STATUS)[keyof typeof CAMPAIGN_STATUS];

/** Matches the user-facing job progress copy. */
export const CAMPAIGN_STAGE = {
  extracting: "extracting",
  analyzing: "analyzing",
  visuals: "visuals",
  postcards: "postcards",
  packaging: "packaging",
  done: "done",
} as const;

export type CampaignStage =
  (typeof CAMPAIGN_STAGE)[keyof typeof CAMPAIGN_STAGE];

export const CAMPAIGN_STAGE_LABEL: Record<CampaignStage, string> = {
  extracting: "Extracting Parcels…",
  analyzing: "Analyzing Properties…",
  visuals: "Generating Visuals…",
  postcards: "Creating Postcards…",
  packaging: "Packaging Files…",
  done: "Complete",
};

export function formatCampaignStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatCampaignStage(stage: string | null | undefined) {
  if (!stage) return null;
  return CAMPAIGN_STAGE_LABEL[stage as CampaignStage] ?? stage;
}

export function canDownloadExport(status: string) {
  return status === CAMPAIGN_STATUS.completed;
}
