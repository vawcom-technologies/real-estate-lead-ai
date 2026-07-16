import type { GradeCounts } from "@/lib/campaign-insights";

export function GradeBreakdown({ grades }: { grades: GradeCounts }) {
  const total = grades.A + grades.B + grades.C + grades.ungraded;
  const items = [
    { label: "Grade A", count: grades.A, color: "bg-emerald-500", text: "text-emerald-700" },
    { label: "Grade B", count: grades.B, color: "bg-amber-400", text: "text-amber-700" },
    { label: "Grade C", count: grades.C, color: "bg-red-400", text: "text-red-700" },
  ];

  return (
    <div className="surface-card p-6">
      <h3 className="text-sm font-semibold text-foreground">Grade distribution</h3>
      <p className="mt-1 text-xs text-muted">
        From rule scoring and OpenAI vision (when configured)
      </p>
      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className={`font-medium ${item.text}`}>{item.label}</span>
                <span className="text-muted">
                  {item.count} ({pct}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {grades.ungraded > 0 ? (
        <p className="mt-3 text-xs text-muted">
          {grades.ungraded} parcel{grades.ungraded === 1 ? "" : "s"} not yet graded
        </p>
      ) : null}
    </div>
  );
}
