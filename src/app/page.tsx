import Link from "next/link";
import { ActivityFeed } from "@/components/activity-feed";
import { CampaignTable } from "@/components/campaign-table";
import { DashboardStats, GradeSummary } from "@/components/dashboard-stats";
import { IntegrationsPanel } from "@/components/integrations-panel";
import { PipelineOverview } from "@/components/pipeline-steps";
import { WelcomeBanner } from "@/components/welcome-banner";
import { getDashboardStats } from "@/lib/dashboard-stats";
import { getLiveIntegrationSummary } from "@/lib/integrations";
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
  const integrations = getLiveIntegrationSummary();

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
    return (
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="font-medium text-amber-900">Database unavailable</p>
          <p className="mt-1 text-sm text-amber-800">
            Start Postgres with{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">
              docker compose up -d
            </code>{" "}
            and run{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">
              npm run worker
            </code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <WelcomeBanner
        runningCount={stats.runningCount}
        integrationsReady={integrations.ready}
        configuredIntegrations={integrations.configured}
        totalIntegrations={integrations.total}
      />
      <DashboardStats stats={stats} />

      <div className="animate-fade-up-delay-2 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PipelineOverview />
          <GradeSummary stats={stats} />
        </div>
        <div className="space-y-6">
          <IntegrationsPanel statuses={integrations.statuses} compact />
          <ActivityFeed
            items={activity.map((c) => ({
              id: c.id,
              postcode: c.postcode,
              agent_name: c.agent_name,
              status: c.status,
              parcelCount: c._count.parcels,
              created_at: c.created_at,
            }))}
          />
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Recent campaigns
          </h2>
          <Link
            href="/campaigns"
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            View all
          </Link>
        </div>
        <CampaignTable campaigns={campaigns} />
      </section>
    </div>
  );
}
