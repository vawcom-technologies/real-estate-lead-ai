import Link from "next/link";
import { Plus } from "lucide-react";
import { ActivityFeed } from "@/components/activity-feed";
import { CampaignTable } from "@/components/campaign-table";
import { DashboardStats } from "@/components/dashboard-stats";
import { LeadQuality } from "@/components/lead-quality";
import { WorkflowOverview } from "@/components/pipeline-steps";
import { buttonClasses } from "@/components/ui/button";
import { DataUnavailable } from "@/components/ui/data-unavailable";
import { SectionHeader } from "@/components/ui/page-header";
import { DashboardGreeting } from "@/components/welcome-banner";
import { getDashboardStats } from "@/lib/dashboard-stats";
import { formatNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getCampaignRows() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { created_at: "desc" },
    take: 5,
    include: {
      _count: { select: { parcels: true } },
      parcels: { where: { grade: "A" }, select: { id: true } },
    },
  });

  return campaigns.map((campaign) => ({
    id: campaign.id,
    postcode: campaign.postcode,
    min_price: campaign.min_price,
    agent_name: campaign.agent_name,
    status: campaign.status,
    created_at: campaign.created_at,
    parcelCount: campaign._count.parcels,
    gradeA: campaign.parcels.length,
  }));
}

export default async function DashboardPage() {
  let stats;
  let campaigns;
  let activity;

  try {
    [stats, campaigns] = await Promise.all([
      getDashboardStats(),
      getCampaignRows(),
    ]);

    activity = await prisma.campaign.findMany({
      orderBy: { created_at: "desc" },
      take: 6,
      include: { _count: { select: { parcels: true } } },
    });
  } catch {
    return <DataUnavailable />;
  }

  const secondary = [
    { label: "AI analyzed", value: stats.aiAnalyzed },
    { label: "Grade B", value: stats.gradeB },
    { label: "Grade C", value: stats.gradeC },
    { label: "Campaigns", value: stats.totalCampaigns },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-[12px] font-medium tracking-wide text-primary">
            Property intelligence
          </p>
          <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-tight text-foreground sm:text-[32px]">
            <DashboardGreeting />
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Monitor campaigns, qualified properties, and AI analysis from one
            workspace.
          </p>
          {stats.runningCount > 0 ? (
            <p className="mt-3 text-sm font-medium text-primary">
              {formatNumber(stats.runningCount)}{" "}
              {stats.runningCount === 1 ? "campaign is" : "campaigns are"} in
              analysis.
            </p>
          ) : null}
        </div>
        <Link href="/campaigns/new" className={buttonClasses("primary", "lg")}>
          <Plus className="h-4 w-4" aria-hidden />
          New campaign
        </Link>
      </div>

      <DashboardStats stats={stats} />

      <dl className="flex flex-wrap gap-x-8 gap-y-3 border-y border-border py-4">
        {secondary.map((item) => (
          <div key={item.label}>
            <dt className="text-[12px] text-muted">{item.label}</dt>
            <dd className="text-sm font-semibold tabular-nums text-foreground">
              {formatNumber(item.value)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <WorkflowOverview />
        <LeadQuality
          grades={{ A: stats.gradeA, B: stats.gradeB, C: stats.gradeC }}
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.7fr)]">
        <section className="space-y-4">
          <SectionHeader
            title="Recent campaigns"
            action={
              <Link
                href="/campaigns"
                className="text-sm font-medium text-primary hover:text-primary-hover"
              >
                View all
              </Link>
            }
          />
          <CampaignTable campaigns={campaigns} />
        </section>
        <ActivityFeed
          items={activity.map((campaign) => ({
            id: campaign.id,
            postcode: campaign.postcode,
            agent_name: campaign.agent_name,
            status: campaign.status,
            parcelCount: campaign._count.parcels,
            created_at: campaign.created_at,
          }))}
        />
      </div>
    </div>
  );
}
