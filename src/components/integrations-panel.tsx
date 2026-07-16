import Link from "next/link";
import type { IntegrationStatus } from "@/lib/integrations";

export function IntegrationsPanel({
  statuses,
  compact = false,
}: {
  statuses: IntegrationStatus[];
  compact?: boolean;
}) {
  const live = statuses.filter((s) => s.phase === "live");

  return (
    <div className="surface-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Integrations
          </h2>
          <p className="mt-1 text-sm text-muted">
            API keys power imagery, validation, and AI scoring.
          </p>
        </div>
        {!compact ? null : (
          <Link
            href="/settings"
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            Manage →
          </Link>
        )}
      </div>

      <ul className="mt-5 space-y-3">
        {live.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{item.name}</p>
              <p className="mt-0.5 text-xs text-muted">{item.description}</p>
              <p className="mt-1 font-mono text-[10px] text-muted/80">
                {item.envVar}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                item.configured
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {item.configured ? "Configured" : "Missing"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
