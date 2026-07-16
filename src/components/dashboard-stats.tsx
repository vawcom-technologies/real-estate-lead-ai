import type { DashboardStats } from "@/lib/dashboard-stats";

const STAT_CARDS: Array<{
  key: keyof DashboardStats;
  label: string;
  hint: string;
}> = [
  {
    key: "activeCampaigns",
    label: "Active campaigns",
    hint: "Pending or running",
  },
  {
    key: "parcelsScanned",
    label: "Qualified parcels",
    hint: "After residential filter",
  },
  {
    key: "terracesIdentified",
    label: "Grade A + B",
    hint: "Terrace opportunity",
  },
  {
    key: "aiAnalyzed",
    label: "AI vision analyzed",
    hint: "OpenAI when configured",
  },
  {
    key: "gradeA",
    label: "Grade A parcels",
    hint: "Highest potential",
  },
  {
    key: "exportsCompleted",
    label: "Exports ready",
    hint: "Completed campaigns",
  },
];

export function DashboardStats({ stats }: { stats: DashboardStats }) {
  return (
    <div className="animate-fade-up-delay-1 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {STAT_CARDS.map((card) => (
        <div key={card.key} className="surface-card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {card.label}
          </p>
          <p className="mt-3 font-display text-3xl tracking-tight text-foreground">
            {stats[card.key].toLocaleString("fr-FR")}
          </p>
          <p className="mt-1 text-xs text-muted">{card.hint}</p>
        </div>
      ))}
    </div>
  );
}

export function GradeSummary({ stats }: { stats: DashboardStats }) {
  const total = stats.gradeA + stats.gradeB + stats.gradeC;
  if (total === 0) {
    return (
      <div className="surface-card p-6">
        <h2 className="text-base font-semibold text-foreground">Grade mix</h2>
        <p className="mt-2 text-sm text-muted">
          Grades appear after scoring / AI vision finishes on a campaign.
        </p>
      </div>
    );
  }

  const rows = [
    { grade: "A", count: stats.gradeA, color: "bg-emerald-500", text: "text-emerald-700" },
    { grade: "B", count: stats.gradeB, color: "bg-amber-500", text: "text-amber-700" },
    { grade: "C", count: stats.gradeC, color: "bg-rose-500", text: "text-rose-700" },
  ];

  return (
    <div className="surface-card p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Grade mix</h2>
        <p className="text-xs text-muted">{total.toLocaleString("fr-FR")} graded</p>
      </div>
      <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-surface">
        {rows.map((row) => (
          <div
            key={row.grade}
            className={`${row.color} transition-all`}
            style={{ width: `${(row.count / total) * 100}%` }}
            title={`Grade ${row.grade}: ${row.count}`}
          />
        ))}
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-3">
        {rows.map((row) => (
          <div key={row.grade} className="rounded-xl bg-surface px-3 py-3">
            <dt className={`text-xs font-semibold ${row.text}`}>Grade {row.grade}</dt>
            <dd className="mt-1 text-xl font-semibold text-foreground">
              {row.count}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
