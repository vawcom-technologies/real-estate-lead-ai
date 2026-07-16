import Link from "next/link";
import { notFound } from "next/navigation";
import { CampaignStatusPoller } from "@/components/campaign-status-poller";
import { DeliverablesPanel } from "@/components/deliverables-panel";
import { GradeBreakdown } from "@/components/grade-breakdown";
import { ParcelGrid } from "@/components/parcel-grid";
import { PipelineSteps } from "@/components/pipeline-steps";
import { StatusBadge } from "@/components/status-badge";
import { getCampaignInsights } from "@/lib/campaign-insights";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      parcels: {
        orderBy: [{ grade: "asc" }, { municipality: "asc" }],
      },
    },
  });

  if (!campaign) {
    notFound();
  }

  const insights = await getCampaignInsights(id);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <CampaignStatusPoller campaignId={campaign.id} status={campaign.status} />

      <div>
        <Link
          href="/campaigns"
          className="text-sm font-medium text-muted hover:text-foreground"
        >
          ← Back to campaigns
        </Link>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl tracking-tight text-foreground">
                Postcode {campaign.postcode}
              </h1>
              <StatusBadge status={campaign.status} />
            </div>
            <p className="text-base font-medium text-foreground">
              {campaign.agent_name}
            </p>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-surface px-3 py-2">
                <dt className="text-xs text-muted">Minimum sale price</dt>
                <dd className="font-semibold">
                  €{Number(campaign.min_price).toLocaleString("fr-FR")}
                </dd>
              </div>
              <div className="rounded-xl bg-surface px-3 py-2">
                <dt className="text-xs text-muted">Qualified parcels</dt>
                <dd className="font-semibold">{insights.parcelCount}</dd>
              </div>
              <div className="rounded-xl bg-surface px-3 py-2">
                <dt className="text-xs text-muted">AI vision analyzed</dt>
                <dd className="font-semibold">{insights.withAnalysis}</dd>
              </div>
              <div className="rounded-xl bg-surface px-3 py-2">
                <dt className="text-xs text-muted">Agent contact</dt>
                <dd className="font-semibold">
                  {campaign.agent_phone} · {campaign.agent_email}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Processing pipeline
            </h2>
            <p className="mt-1 text-sm text-muted">
              Extraction → validation → imagery → scoring → vision → marketing
            </p>
          </div>
        </div>
        <PipelineSteps status={campaign.status} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <GradeBreakdown grades={insights.grades} />
        </div>
        <div className="lg:col-span-2">
          <DeliverablesPanel
            campaignId={campaign.id}
            status={campaign.status}
            parcelCount={insights.parcelCount}
          />
        </div>
      </div>

      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">
            Qualified parcels ({campaign.parcels.length})
          </h2>
          <p className="mt-1 text-sm text-muted">
            Click a parcel for full cadastre data, sale info, scoring reason,
            AI analysis, and before/after preview status.
          </p>
        </div>
        <ParcelGrid parcels={campaign.parcels} />
      </section>
    </div>
  );
}
