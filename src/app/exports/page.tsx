import Link from "next/link";
import { CampaignDownloadButton } from "@/components/campaign-download-button";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getWorkspaceCampaigns } from "@/lib/demo-workspace";
import { formatDate, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ExportsPage() {
  const campaigns = getWorkspaceCampaigns();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <PageHeader
        eyebrow="Library"
        title="Exports"
        description="Download property datasets, imagery, postcards, and the full marketing kit for each campaign."
      />

      {campaigns.length === 0 ? (
        <EmptyState
          title="No campaign assets yet"
          description="Exports appear here after you launch a campaign. Completed campaigns can be downloaded immediately."
          action={{ href: "/campaigns/new", label: "New campaign" }}
        />
      ) : (
        <div className="space-y-6">
          {campaigns.map((campaign) => (
            <article key={campaign.id} className="ui-card p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                      {campaign.postcode}
                    </h2>
                    <StatusBadge status={campaign.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {campaign.agent_name} · {formatNumber(campaign.parcels.length)}{" "}
                    properties · {formatDate(campaign.created_at)}
                  </p>
                </div>
                <Link
                  href={`/campaigns/${campaign.id}?view=assets`}
                  className="text-sm font-medium text-primary hover:text-primary-hover"
                >
                  Open campaign
                </Link>
              </div>
              <CampaignDownloadButton
                campaignId={campaign.id}
                status={campaign.status}
                parcelCount={campaign.parcels.length}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
