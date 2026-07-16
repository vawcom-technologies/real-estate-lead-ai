import Link from "next/link";
import { CampaignDownloadButton } from "@/components/campaign-download-button";
import { StatusBadge } from "@/components/status-badge";
import { CAMPAIGN_STATUS } from "@/lib/campaign-status";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ExportsPage() {
  let campaigns;

  try {
    campaigns = await prisma.campaign.findMany({
      where: { status: CAMPAIGN_STATUS.completed },
      orderBy: { created_at: "desc" },
      include: { _count: { select: { parcels: true } } },
    });
  } catch {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <p className="font-medium text-amber-900">Database unavailable</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl tracking-tight text-foreground">
          Exports library
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Completed campaigns produce a parcel spreadsheet (Excel) and a marketing
          kit ZIP with postcards, property reports, satellite images, and a
          campaign summary PDF.
        </p>
      </div>

      {campaigns.length === 0 ? (
        <div className="surface-card border-dashed px-8 py-16 text-center">
          <p className="font-display text-2xl text-foreground">
            Nothing to download yet
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Exports appear here once a campaign finishes processing on the worker.
          </p>
          <Link
            href="/campaigns"
            className="mt-8 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Go to campaigns
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {campaigns.map((campaign) => (
            <article key={campaign.id} className="surface-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">
                      Postcode {campaign.postcode}
                    </h2>
                    <StatusBadge status={campaign.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted">{campaign.agent_name}</p>
                  <p className="mt-2 text-sm text-muted">
                    {campaign._count.parcels} parcels ·{" "}
                    {campaign.created_at.toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className="text-sm font-medium text-primary hover:text-primary-hover"
                >
                  View campaign →
                </Link>
              </div>

              <div className="mt-6 border-t border-border pt-6">
                <CampaignDownloadButton
                  campaignId={campaign.id}
                  status={campaign.status}
                  parcelCount={campaign._count.parcels}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
