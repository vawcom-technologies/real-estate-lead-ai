import Link from "next/link";
import { notFound } from "next/navigation";
import { CampaignStatusPoller } from "@/components/campaign-status-poller";
import { DeliverablesPanel } from "@/components/deliverables-panel";
import { GradeBreakdown } from "@/components/grade-breakdown";
import { ParcelGrid } from "@/components/parcel-grid";
import { PipelineSteps } from "@/components/pipeline-steps";
import { StatusBadge } from "@/components/status-badge";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";
import { campaignAssets } from "@/lib/campaign-assets";
import { getCampaignInsights } from "@/lib/campaign-insights";
import { canDownloadExport } from "@/lib/campaign-status";
import { getWorkspaceCampaign } from "@/lib/demo-workspace";
import { formatDate, formatEuro, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

const VIEWS = [
  { id: "overview", label: "Overview" },
  { id: "properties", label: "Properties" },
  { id: "analysis", label: "AI analysis" },
  { id: "assets", label: "Campaign assets" },
] as const;

type View = (typeof VIEWS)[number]["id"];

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
};

function resolveView(value?: string): View {
  return VIEWS.some((view) => view.id === value) ? (value as View) : "overview";
}

export default async function CampaignDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { view: requestedView } = await searchParams;
  const view = resolveView(requestedView);

  const campaign = getWorkspaceCampaign(id);
  if (!campaign) {
    notFound();
  }
  const insights = await getCampaignInsights(id);
  const ready = canDownloadExport(campaign.status);
  const assets = campaignAssets(campaign.id);
  const excel = assets.find((asset) => asset.id === "excel");
  const postcards = assets.find((asset) => asset.id === "postcards");
  const kit = assets.find((asset) => asset.id === "package");
  const parcels = campaign.parcels.map((parcel) => ({
    ...parcel,
    sale_price: parcel.sale_price === null ? null : Number(parcel.sale_price),
    house_area: parcel.house_area === null ? null : Number(parcel.house_area),
    plot_area: parcel.plot_area === null ? null : Number(parcel.plot_area),
    sale_date: parcel.sale_date?.toISOString() ?? null,
  }));
  const analyzed = parcels.filter((parcel) => parcel.analysis);
  const share =
    insights.parcelCount === 0
      ? 0
      : Math.round((insights.grades.A / insights.parcelCount) * 100);

  const metrics = [
    { label: "Qualified properties", value: formatNumber(insights.parcelCount) },
    { label: "Grade A", value: formatNumber(insights.grades.A) },
    { label: "Grade B", value: formatNumber(insights.grades.B) },
    { label: "AI analyzed", value: formatNumber(insights.withAnalysis) },
    { label: "High-potential share", value: `${share}%` },
    { label: "Grade C", value: formatNumber(insights.grades.C) },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <CampaignStatusPoller
        campaignId={campaign.id}
        status={campaign.status}
        stage={campaign.stage}
      />

      <Breadcrumb
        items={[
          { href: "/campaigns", label: "Campaigns" },
          { label: campaign.postcode },
        ]}
      />

      <PageHeader
        eyebrow="Campaign"
        title={campaign.postcode}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <StatusBadge status={campaign.status} />
            <span>{campaign.agent_name}</span>
          </span>
        }
        meta={
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
            <span>From {formatEuro(Number(campaign.min_price))}</span>
            <span>{campaign.agent_phone}</span>
            <span>{campaign.agent_email}</span>
            <span>Created {formatDate(campaign.created_at)}</span>
          </p>
        }
        actions={
          ready && excel && postcards && kit ? (
            <>
              <a
                href={excel.href}
                download={excel.download}
                className={buttonClasses("secondary", "sm")}
              >
                Export Excel
              </a>
              <a
                href={postcards.href}
                download={postcards.download}
                className={buttonClasses("secondary", "sm")}
              >
                Postcards
              </a>
              <a
                href={kit.href}
                download={kit.download}
                className={buttonClasses("primary", "sm")}
              >
                Marketing kit
              </a>
            </>
          ) : null
        }
      />

      <nav
        aria-label="Campaign sections"
        className="flex gap-6 overflow-x-auto border-b border-border"
      >
        {VIEWS.map((tab) => {
          const active = view === tab.id;
          const count =
            tab.id === "properties"
              ? campaign.parcels.length
              : tab.id === "analysis"
                ? analyzed.length
                : null;
          return (
            <Link
              key={tab.id}
              href={`/campaigns/${campaign.id}?view=${tab.id}`}
              aria-current={active ? "page" : undefined}
              className={`-mb-px shrink-0 border-b-2 pb-3 pt-1 text-sm font-medium ${
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
              {count !== null ? (
                <span className="ml-1.5 tabular-nums text-[12px] text-muted">
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {view === "overview" ? (
        <div className="space-y-6">
          <section className="ui-card grid grid-cols-2 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="px-5 py-4">
                <p className="text-[12px] text-muted">{metric.label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                  {metric.value}
                </p>
              </div>
            ))}
          </section>
          <section className="ui-card p-6">
            <h2 className="text-lg font-semibold tracking-tight">
              Analysis progress
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              The campaign moves through these steps automatically.
            </p>
            <div className="mt-6">
              <PipelineSteps status={campaign.status} stage={campaign.stage} />
            </div>
          </section>
          <GradeBreakdown grades={insights.grades} />
        </div>
      ) : null}

      {view === "properties" ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Properties</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Open a property for the sale record, site analysis, and marketing
              angle.
            </p>
          </div>
          <ParcelGrid parcels={parcels} />
        </section>
      ) : null}

      {view === "analysis" ? (
        <div className="space-y-6">
          <GradeBreakdown grades={insights.grades} />
          {analyzed.length === 0 ? (
            <EmptyState
              title="No AI analysis yet"
              description="Reviews appear here after imagery has been scored. Properties can still be graded from site rules before that."
            />
          ) : (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Reviewed properties
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  These properties include a written site analysis.
                </p>
              </div>
              <ParcelGrid parcels={analyzed} />
            </section>
          )}
        </div>
      ) : null}

      {view === "assets" ? (
        <DeliverablesPanel
          campaignId={campaign.id}
          status={campaign.status}
          parcelCount={insights.parcelCount}
        />
      ) : null}
    </div>
  );
}
