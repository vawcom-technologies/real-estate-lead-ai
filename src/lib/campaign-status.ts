export const CAMPAIGN_STATUS = {
  pending: "pending",
  running: "running",
  completed: "completed",
  failed: "failed",
} as const;

export type CampaignStatus =
  (typeof CAMPAIGN_STATUS)[keyof typeof CAMPAIGN_STATUS];

export function formatCampaignStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function canDownloadExport(status: string) {
  return status === CAMPAIGN_STATUS.completed;
}
