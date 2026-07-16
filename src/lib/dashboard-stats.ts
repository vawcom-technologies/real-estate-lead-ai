import { CAMPAIGN_STATUS } from "@/lib/campaign-status";
import { prisma } from "@/lib/prisma";

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
  const [
    campaigns,
    parcelCount,
    gradeA,
    gradeB,
    gradeC,
    gradeAB,
    withAnalysis,
    completedCount,
  ] = await Promise.all([
    prisma.campaign.findMany({ select: { status: true } }),
    prisma.parcel.count(),
    prisma.parcel.count({ where: { grade: "A" } }),
    prisma.parcel.count({ where: { grade: "B" } }),
    prisma.parcel.count({ where: { grade: "C" } }),
    prisma.parcel.count({ where: { grade: { in: ["A", "B"] } } }),
    prisma.parcel.count({ where: { analysis: { not: null } } }),
    prisma.campaign.count({ where: { status: CAMPAIGN_STATUS.completed } }),
  ]);

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
