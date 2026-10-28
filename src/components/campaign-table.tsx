import Link from "next/link";
import { CampaignRowMenu } from "@/components/campaign-row-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/status-badge";
import {
  decimalToNumber,
  formatDate,
  formatNumber,
  priceThresholdLabel,
} from "@/lib/format";

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

export function CampaignTable({
  campaigns,
  empty = "first",
}: {
  campaigns: CampaignRow[];
  empty?: "first" | "results";
}) {
  if (campaigns.length === 0) {
    if (empty === "results") {
      return (
        <EmptyState
          title="No campaigns match these filters"
          description="Try another postcode, agent, status, or date range."
          action={{ href: "/campaigns", label: "Clear filters" }}
        />
      );
    }

    return (
      <EmptyState
        title="No campaigns yet"
        description="Launch a campaign to find recent house sales, score terrace potential, and prepare marketing assets."
        action={{ href: "/campaigns/new", label: "New campaign" }}
      />
    );
  }

  return (
    <div className="ui-card overflow-hidden">
      <p className="border-b border-border px-4 py-2 text-[12px] text-muted lg:hidden">
        Scroll sideways to see every column.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left">
          <caption className="sr-only">Campaigns</caption>
          <thead>
            <tr className="border-b border-border text-[12px] font-medium text-muted">
              <th className="px-4 py-3 font-medium">Campaign</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 font-medium">Properties</th>
              <th className="px-4 py-3 font-medium">High potential</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {campaigns.map((campaign) => {
              const minPrice = decimalToNumber(campaign.min_price) ?? 0;
              return (
                <tr key={campaign.id} className="transition-colors hover:bg-surface/70">
                  <td className="px-4 py-4">
                    <Link href={`/campaigns/${campaign.id}`} className="group block">
                      <span className="block text-sm font-semibold text-foreground group-hover:text-primary">
                        {campaign.postcode}
                      </span>
                      <span className="mt-0.5 block text-[13px] text-muted">
                        {priceThresholdLabel(minPrice)}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-sm text-foreground">
                    France · {campaign.postcode}
                  </td>
                  <td className="px-4 py-4 text-sm text-foreground">
                    {campaign.agent_name}
                  </td>
                  <td className="px-4 py-4 text-sm tabular-nums text-foreground">
                    {formatNumber(campaign.parcelCount)}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium tabular-nums text-forest">
                    {formatNumber(campaign.gradeA ?? 0)}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={campaign.status} />
                  </td>
                  <td className="px-4 py-4 text-sm text-muted">
                    {formatDate(campaign.created_at)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <CampaignRowMenu
                      campaignId={campaign.id}
                      postcode={campaign.postcode}
                      status={campaign.status}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
