import { NextResponse } from "next/server";
import { getCampaignInsights } from "@/lib/campaign-insights";
import { getWorkspaceCampaign } from "@/lib/demo-workspace";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const campaign = getWorkspaceCampaign(id);

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const insights = await getCampaignInsights(id);

  return NextResponse.json({
    id: campaign.id,
    status: campaign.status,
    stage: campaign.stage,
    postcode: campaign.postcode,
    parcelCount: campaign.parcels.length,
    grades: insights.grades,
    withAnalysis: insights.withAnalysis,
    created_at: campaign.created_at,
  });
}
