import { NextResponse } from "next/server";
import { getCampaignInsights } from "@/lib/campaign-insights";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      stage: true,
      postcode: true,
      created_at: true,
      _count: { select: { parcels: true } },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const insights = await getCampaignInsights(id);

  return NextResponse.json({
    id: campaign.id,
    status: campaign.status,
    stage: campaign.stage,
    postcode: campaign.postcode,
    parcelCount: campaign._count.parcels,
    grades: insights.grades,
    withAnalysis: insights.withAnalysis,
    created_at: campaign.created_at,
  });
}
