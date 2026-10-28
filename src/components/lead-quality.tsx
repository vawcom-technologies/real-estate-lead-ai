const ROWS = [
  {
    grade: "A" as const,
    name: "High opportunity",
    bar: "bg-primary",
    text: "text-forest",
  },
  {
    grade: "B" as const,
    name: "Potential",
    bar: "bg-amber",
    text: "text-amber",
  },
  {
    grade: "C" as const,
    name: "Low priority",
    bar: "bg-rose",
    text: "text-rose",
  },
];

export function LeadQuality({
  grades,
  title = "Lead quality",
  description = "Grade A properties are the strongest sales opportunities.",
}: {
  grades: { A: number; B: number; C: number; ungraded?: number };
  title?: string;
  description?: string;
}) {
  const graded = grades.A + grades.B + grades.C;
  const ungraded = grades.ungraded ?? 0;

  if (graded === 0) {
    return (
      <section className="ui-card p-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Grades appear once property scoring finishes.
        </p>
      </section>
    );
  }

  return (
    <section className="ui-card p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="text-[12px] text-muted">
          {graded.toLocaleString("fr-FR")} graded
        </p>
      </div>
      <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
      <div
        className="mt-5 flex h-2 overflow-hidden rounded-full bg-surface"
        role="img"
        aria-label={ROWS.map((row) => {
          const pct = Math.round((grades[row.grade] / graded) * 100);
          return `Grade ${row.grade} ${pct}%`;
        }).join(", ")}
      >
        {ROWS.map((row) => (
          <div
            key={row.grade}
            className={row.bar}
            style={{ width: `${(grades[row.grade] / graded) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-5 space-y-3">
        {ROWS.map((row) => {
          const count = grades[row.grade];
          const pct = Math.round((count / graded) * 100);
          return (
            <li key={row.grade} className="flex items-center gap-3">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-[12px] font-semibold ${
                  row.grade === "A"
                    ? "bg-primary-soft text-forest"
                    : row.grade === "B"
                      ? "bg-accent-soft text-amber"
                      : "bg-rose/10 text-rose"
                }`}
              >
                {row.grade}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className={`text-sm font-medium ${row.text}`}>{row.name}</p>
                  <p className="text-sm tabular-nums text-foreground">
                    {count.toLocaleString("fr-FR")}
                    <span className="ml-1.5 text-[12px] text-muted">{pct}%</span>
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {ungraded > 0 ? (
        <p className="mt-4 text-[12px] text-muted">
          {ungraded.toLocaleString("fr-FR")}{" "}
          {ungraded === 1 ? "property is" : "properties are"} still waiting for a
          grade.
        </p>
      ) : null}
    </section>
  );
}
