import Link from "next/link";
import { IntegrationsPanel } from "@/components/integrations-panel";
import { getIntegrationStatuses } from "@/lib/integrations";

export const dynamic = "force-dynamic";

const ROADMAP = [
  {
    phase: "Phase 1",
    title: "Parcel extraction",
    status: "live",
    items: [
      "Campaign creation",
      "DVF house-sale extraction",
      "Price & plot filters (≥ 80 m²)",
      "Excel export",
      "Redis / BullMQ worker",
    ],
  },
  {
    phase: "Phase 2",
    title: "Property intelligence",
    status: "live",
    items: [
      "BAN + OSM + Google validation",
      "Satellite imagery (Google / IGN)",
      "Rule-based A/B/C scoring",
      "OpenAI vision analysis",
      "Grade + reason in Excel",
    ],
  },
  {
    phase: "Phase 3",
    title: "AI visualization",
    status: "soon",
    items: [
      "Before satellite image",
      "After terrace render (OpenAI Images)",
      "Cloud storage (S3 / R2)",
      "Optional YOLO / SAM segmentation later",
    ],
  },
  {
    phase: "Phase 4–5",
    title: "Marketing & platform",
    status: "partial",
    items: [
      "Postcards + property reports (live)",
      "Marketing ZIP package (live)",
      "Interactive map view (soon)",
      "Authentication / multi-user (soon)",
    ],
  },
];

export default function SettingsPage() {
  const statuses = getIntegrationStatuses();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="font-display text-3xl tracking-tight text-foreground">
          Integrations & roadmap
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Configure API keys in your <code className="rounded bg-surface px-1.5 py-0.5 text-xs">.env</code>{" "}
          file, restart the Next.js app and worker, then launch campaigns. Keys are
          never shown in the UI — only whether they are present.
        </p>
      </div>

      <IntegrationsPanel statuses={statuses} />

      <section className="surface-card p-6">
        <h2 className="text-base font-semibold text-foreground">
          Required environment variables
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="py-3 pr-4">Variable</th>
                <th className="py-3 pr-4">Used for</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {statuses.map((item) => (
                <tr key={`${item.id}-${item.phase}`}>
                  <td className="py-3 pr-4 font-mono text-xs">{item.envVar}</td>
                  <td className="py-3 pr-4 text-muted">
                    {item.name}
                    {item.phase === "planned" ? " (planned)" : ""}
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        item.configured
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {item.configured ? "Set" : "Not set"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted">
          For Google Maps, enable <strong>Geocoding API</strong> and{" "}
          <strong>Maps Static API</strong>. For OpenAI, the same{" "}
          <code className="rounded bg-surface px-1">OPENAI_API_KEY</code> powers
          vision scoring now and image generation in Phase 3.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {ROADMAP.map((block) => (
          <article key={block.phase} className="surface-card p-6">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {block.phase}
              </p>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  block.status === "live"
                    ? "bg-emerald-50 text-emerald-700"
                    : block.status === "partial"
                      ? "bg-sky-50 text-sky-700"
                      : "bg-accent-soft text-amber-800"
                }`}
              >
                {block.status === "live"
                  ? "Live"
                  : block.status === "partial"
                    ? "Partial"
                    : "Coming soon"}
              </span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-foreground">
              {block.title}
            </h3>
            <ul className="mt-4 space-y-2">
              {block.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <div className="rounded-2xl border border-border bg-surface px-6 py-5 text-sm text-muted">
        <p className="font-medium text-foreground">Worker reminder</p>
        <p className="mt-1">
          Jobs are stored in Redis. Run{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-xs">npm run worker</code>{" "}
          alongside{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-xs">npm run dev</code>{" "}
          so campaigns leave the queue and process automatically.
        </p>
        <Link
          href="/campaigns/new"
          className="mt-4 inline-flex font-medium text-primary hover:text-primary-hover"
        >
          Launch a campaign →
        </Link>
      </div>
    </div>
  );
}
