import { CAMPAIGN_STATUS } from "@/lib/campaign-status";
import { getWorkspaceCampaigns } from "@/lib/demo-workspace";

export type DashboardStats = {
  activeCampaigns: number;
  parcelsScanned: number;
  terracesIdentified: number;
  aiAnalyzed: number;
  imagesAvailable: number;
  exportsCompleted: number;
  runningCount: number;
  totalCampaigns: number;
  gradeA: number;
  gradeB: number;
  gradeC: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const campaigns = getWorkspaceCampaigns();
  const parcels = campaigns.flatMap((campaign) => campaign.parcels);
  const gradeA = parcels.filter((parcel) => parcel.grade === "A").length;
  const gradeB = parcels.filter((parcel) => parcel.grade === "B").length;
  const gradeC = parcels.filter((parcel) => parcel.grade === "C").length;
  const gradeAB = gradeA + gradeB;
  const withAnalysis = parcels.filter((parcel) => parcel.analysis).length;
  const completedCount = campaigns.filter(
    (campaign) => campaign.status === CAMPAIGN_STATUS.completed,
  ).length;
  const parcelCount = parcels.length;

  const activeCampaigns = campaigns.filter(
    (c) =>
      c.status === CAMPAIGN_STATUS.running ||
      c.status === CAMPAIGN_STATUS.pending,
  ).length;

  const runningCount = campaigns.filter(
    (c) => c.status === CAMPAIGN_STATUS.running,
  ).length;

  return {
    activeCampaigns,
    parcelsScanned: parcelCount,
    terracesIdentified: gradeAB,
    aiAnalyzed: withAnalysis,
    imagesAvailable: parcelCount,
    exportsCompleted: completedCount,
    runningCount,
    totalCampaigns: campaigns.length,
    gradeA,
    gradeB,
    gradeC,
  };
}
