import { Plus } from "lucide-react";
import { CampaignFilters } from "@/components/campaign-filters";
import { CampaignTable } from "@/components/campaign-table";
import { ButtonLink } from "@/components/ui/button";
import { DataUnavailable } from "@/components/ui/data-unavailable";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUSES = new Set(["pending", "running", "completed", "failed"]);

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    postcode?: string;
    agent?: string;
    from?: string;
    to?: string;
  }>;
};

function parseDay(value: string | undefined, end: boolean): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T${end ? "23:59:59.999" : "00:00:00"}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default async function CampaignsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = STATUSES.has(params.status ?? "") ? params.status ?? "" : "";
  const postcode = params.postcode?.trim() ?? "";
  const agent = params.agent?.trim() ?? "";
  const fromValue = params.from ?? "";
  const toValue = params.to ?? "";
  const from = parseDay(fromValue, false);
  const to = parseDay(toValue, true);
  const filtered =
    Boolean(query || status || postcode || agent || from || to);

  let campaigns;

  try {
    const rows = await prisma.campaign.findMany({
      orderBy: { created_at: "desc" },
      include: {
        _count: { select: { parcels: true } },
        parcels: {
          select: { grade: true, address: true, municipality: true },
        },
      },
    });

    const mapped = rows.map((campaign) => ({
      id: campaign.id,
      postcode: campaign.postcode,
      min_price: campaign.min_price,
      agent_name: campaign.agent_name,
      status: campaign.status,
      created_at: campaign.created_at,
      parcelCount: campaign._count.parcels,
      gradeA: campaign.parcels.filter((parcel) => parcel.grade === "A").length,
      searchText: [
        campaign.postcode,
        campaign.agent_name,
        campaign.id,
        ...campaign.parcels.flatMap((parcel) => [
          parcel.address ?? "",
          parcel.municipality,
        ]),
      ]
        .join(" ")
        .toLowerCase(),
    }));

    campaigns = mapped.filter((campaign) => {
      if (status && campaign.status !== status) return false;
      if (
        postcode &&
        !campaign.postcode.toLowerCase().includes(postcode.toLowerCase())
      ) {
        return false;
      }
      if (
        agent &&
        !campaign.agent_name.toLowerCase().includes(agent.toLowerCase())
      ) {
        return false;
      }
      if (from && campaign.created_at < from) return false;
      if (to && campaign.created_at > to) return false;
      if (query && !campaign.searchText.includes(query.toLowerCase())) {
        return false;
      }
      return true;
    });
  } catch {
    return <DataUnavailable />;
  }

  const areaCount = new Set(campaigns.map((campaign) => campaign.postcode)).size;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Campaigns"
        description={
          <>
            {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"} across{" "}
            {areaCount} area{areaCount === 1 ? "" : "s"}
            {query ? (
              <>
                {" "}
                matching <span className="font-medium text-foreground">“{query}”</span>
              </>
            ) : null}
            .
          </>
        }
        actions={
          <ButtonLink href="/campaigns/new">
            <Plus className="h-4 w-4" aria-hidden />
            New campaign
          </ButtonLink>
        }
      />

      <CampaignFilters
        q={query}
        status={status}
        postcode={postcode}
        agent={agent}
        from={from ? fromValue : ""}
        to={to ? toValue : ""}
        active={filtered}
      />

      <CampaignTable
        campaigns={campaigns}
        empty={filtered ? "results" : "first"}
      />
    </div>
  );
}
