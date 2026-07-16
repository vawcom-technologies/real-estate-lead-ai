import Link from "next/link";
import { CampaignTable } from "@/components/campaign-table";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function CampaignsPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  let campaigns;
  let areaCount = 0;

  try {
    const rows = await prisma.campaign.findMany({
      orderBy: { created_at: "desc" },
      include: {
        _count: { select: { parcels: true } },
        parcels: { where: { grade: "A" }, select: { id: true } },
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
      gradeA: campaign.parcels.length,
    }));

    campaigns = query
      ? mapped.filter((campaign) => {
          const haystack =
            `${campaign.postcode} ${campaign.agent_name} ${campaign.id}`.toLowerCase();
          return haystack.includes(query.toLowerCase());
        })
      : mapped;

    areaCount = new Set(campaigns.map((c) => c.postcode)).size;
  } catch {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <p className="font-medium text-amber-900">Database unavailable</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight text-foreground">
            Campaigns
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"} across{" "}
            {areaCount} area{areaCount === 1 ? "" : "s"}
            {query ? (
              <>
                {" "}
                matching <span className="font-medium text-foreground">“{query}”</span>
              </>
            ) : null}
            . Open a campaign to inspect parcels, grades, and downloads.
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="inline-flex shrink-0 items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/15 transition-colors hover:bg-primary-hover"
        >
          Launch campaign
        </Link>
      </div>

      {query ? (
        <Link
          href="/campaigns"
          className="inline-flex text-sm font-medium text-primary hover:text-primary-hover"
        >
          Clear search
        </Link>
      ) : null}

      <CampaignTable campaigns={campaigns} />
    </div>
  );
}
