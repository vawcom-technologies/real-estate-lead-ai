import { CampaignDownloadButton } from "@/components/campaign-download-button";
import { formatCampaignStatus } from "@/lib/campaign-status";
import { prisma } from "@/lib/prisma";

export async function CampaignList() {
  let campaigns;

  try {
    campaigns = await prisma.campaign.findMany({
      orderBy: { created_at: "desc" },
      take: 10,
      include: {
        _count: { select: { parcels: true } },
      },
    });
  } catch {
    return (
      <section className="mt-10 rounded-lg border border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-medium text-amber-900">
          Database unavailable
        </p>
        <p className="mt-1 text-sm text-amber-800">
          Start Postgres with{" "}
          <code className="rounded bg-amber-100 px-1">docker compose up -d</code>{" "}
          and check your{" "}
          <code className="rounded bg-amber-100 px-1">DATABASE_URL</code> in{" "}
          <code className="rounded bg-amber-100 px-1">.env</code>.
        </p>
      </section>
    );
  }

  if (campaigns.length === 0) {
    return null;
  }

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-stone-500">
        Recent campaigns
      </h2>
      <ul className="flex flex-col gap-3">
        {campaigns.map((campaign) => (
          <li
            key={campaign.id}
            className="rounded-lg border border-stone-200 bg-white p-5"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-stone-900">
                  {campaign.postcode} · min €
                  {Number(campaign.min_price).toLocaleString("fr-FR")}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {campaign.agent_name} · {campaign._count.parcels} parcels
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                {formatCampaignStatus(campaign.status)}
              </span>
            </div>
            <CampaignDownloadButton
              campaignId={campaign.id}
              status={campaign.status}
              parcelCount={campaign._count.parcels}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
