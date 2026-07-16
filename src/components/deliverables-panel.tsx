import { CampaignDownloadButton } from "@/components/campaign-download-button";

const DELIVERABLES = [
  {
    title: "Parcel spreadsheet",
    desc: "Excel with grades, reasons, and AI analysis",
    status: "live" as const,
  },
  {
    title: "Satellite images",
    desc: "Google Maps or IGN orthophoto per parcel",
    status: "live" as const,
  },
  {
    title: "Property reports",
    desc: "PDF report per parcel in the marketing ZIP",
    status: "live" as const,
  },
  {
    title: "Postcards",
    desc: "Print-ready PDF with agent branding",
    status: "live" as const,
  },
  {
    title: "Before / after images",
    desc: "OpenAI image generation · Phase 3",
    status: "soon" as const,
  },
  {
    title: "Map visualization",
    desc: "Grade-colored parcel map · Phase 5",
    status: "soon" as const,
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
