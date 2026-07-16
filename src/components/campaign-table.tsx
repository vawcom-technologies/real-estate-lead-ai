import Link from "next/link";
import { CampaignDownloadButton } from "@/components/campaign-download-button";
import { StatusBadge } from "@/components/status-badge";

export type CampaignRow = {
  id: string;
  postcode: string;
  min_price: { toString(): string } | number;
  agent_name: string;
  status: string;
  created_at: Date;
  parcelCount: number;
  gradeA?: number;
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMinPrice(value: { toString(): string } | number): string {
  return Number(value.toString()).toLocaleString("fr-FR");
}

export function CampaignTable({ campaigns }: { campaigns: CampaignRow[] }) {
  if (campaigns.length === 0) {
    return (
      <div className="surface-card px-8 py-16 text-center">
        <p className="font-display text-2xl text-foreground">No campaigns yet</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Create a campaign to search house sales by postcode, score terraces,
          and generate marketing materials.
        </p>
        <Link
          href="/campaigns/new"
          className="mt-8 inline-flex items-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Launch your first campaign
        </Link>
      </div>
    );
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left">
          <thead>
            <tr className="border-b border-border bg-surface/70">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted">
                Campaign
              </th>
              <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-muted">
                Parcels
              </th>
              <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-muted">
                Grade A
              </th>
              <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-muted">
                Status
              </th>
              <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-muted">
                Created
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="align-top transition-colors hover:bg-surface/50">
                <td className="px-6 py-5">
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="group block"
                  >
                    <p className="font-semibold text-foreground group-hover:text-primary">
                      Postcode {campaign.postcode}
                    </p>
                    <p className="mt-1 text-sm text-muted">{campaign.agent_name}</p>
                    <p className="mt-1 text-xs text-muted">
                      Min. €{formatMinPrice(campaign.min_price)}
                    </p>
                  </Link>
                </td>
                <td className="px-4 py-5 text-sm font-medium text-foreground">
                  {campaign.parcelCount}
                </td>
                <td className="px-4 py-5 text-sm font-medium text-emerald-700">
                  {campaign.gradeA ?? 0}
                </td>
                <td className="px-4 py-5">
                  <StatusBadge status={campaign.status} />
                </td>
                <td className="px-4 py-5 text-sm text-muted">
                  {formatDate(campaign.created_at)}
                </td>
                <td className="px-6 py-5">
                  <CampaignDownloadButton
                    campaignId={campaign.id}
                    status={campaign.status}
                    parcelCount={campaign.parcelCount}
                    compact
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
