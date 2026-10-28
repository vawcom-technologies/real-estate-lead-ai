import Link from "next/link";
import type { IntegrationStatus } from "@/lib/integrations";

const COPY: Record<string, { name: string; description: string }> = {
  postgres: {
    name: "Workspace database",
    description: "Stores campaigns, properties, grades, and analysis.",
  },
  redis: {
    name: "Background processing",
    description: "Runs property analysis after a campaign is launched.",
  },
  "google-maps": {
    name: "Google Maps",
    description: "Address checks and satellite imagery.",
  },
  "openai-vision": {
    name: "AI analysis",
    description: "Reviews imagery and refines opportunity grades.",
  },
  "openai-images": {
    name: "Visual generation",
    description: "Creates terrace visualizations from satellite photos.",
  },
  "cloudflare-r2": {
    name: "Asset storage",
    description: "Optional cloud storage for imagery. Local storage is used otherwise.",
  },
};

function present(item: IntegrationStatus) {
  return COPY[item.id] ?? { name: item.name, description: item.description };
}

export function IntegrationsPanel({
  statuses,
  compact = false,
}: {
  statuses: IntegrationStatus[];
  compact?: boolean;
}) {
  const live = statuses.filter((item) => item.phase === "live");

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Connections
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Keys stay on the server and are never shown here.
          </p>
        </div>
        {compact ? (
          <Link
            href="/settings"
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            Manage
          </Link>
        ) : null}
      </div>
      <ul className={compact ? "space-y-2" : "grid gap-3 md:grid-cols-2"}>
        {live.map((item) => {
          const copy = present(item);
          return (
            <li key={item.id} className="ui-card px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">{copy.name}</p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    item.configured
                      ? "bg-primary-soft text-forest"
                      : "bg-accent-soft text-amber"
                  }`}
                >
                  {item.configured ? "Configured" : "Needs setup"}
                </span>
              </div>
              <p className="mt-1.5 text-[13px] leading-5 text-muted">
                {copy.description}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
