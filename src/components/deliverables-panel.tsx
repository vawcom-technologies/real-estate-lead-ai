import { CampaignDownloadButton } from "@/components/campaign-download-button";

const DELIVERABLES = [
  {
    title: "parcels.xlsx",
    desc: "Excel with grades, reasons, and AI analysis",
    status: "live" as const,
  },
  {
    title: "before_images.zip",
    desc: "Satellite / orthophoto JPEGs per parcel",
    status: "live" as const,
  },
  {
    title: "after_images.zip",
    desc: "AI terrace visualizations (OpenAI Images)",
    status: "live" as const,
  },
  {
    title: "postcards.zip",
    desc: "BEFORE | AFTER PDFs · value uplift · agent on back",
    status: "live" as const,
  },
  {
    title: "Property reports",
    desc: "PDF report per parcel in the marketing kit",
    status: "live" as const,
  },
  {
    title: "Cloud storage (R2)",
    desc: "Optional Cloudflare R2 sync for before/after images",
    status: "live" as const,
  },
];

export function DeliverablesPanel({
  campaignId,
  status,
  parcelCount,
}: {
  campaignId: string;
  status: string;
  parcelCount: number;
}) {
  return (
    <div className="surface-card p-6">
      <h3 className="text-sm font-semibold text-foreground">Deliverables</h3>
      <p className="mt-1 text-sm text-muted">
        What this campaign produces when processing completes.
      </p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {DELIVERABLES.map((item) => (
          <li
            key={item.title}
            className="rounded-xl border border-border bg-background px-4 py-3"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  item.status === "live"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-accent-soft text-amber-800"
                }`}
              >
                {item.status === "live" ? "Live" : "Soon"}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">{item.desc}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-border pt-5">
        <CampaignDownloadButton
          campaignId={campaignId}
          status={status}
          parcelCount={parcelCount}
        />
      </div>
    </div>
  );
}
