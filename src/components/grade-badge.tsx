const GRADE_STYLES: Record<string, string> = {
  A: "bg-primary-soft text-forest ring-primary/20",
  B: "bg-accent-soft text-amber ring-amber/25",
  C: "bg-rose/10 text-rose ring-rose/20",
};

const GRADE_NAMES: Record<string, string> = {
  A: "High opportunity",
  B: "Potential",
  C: "Low priority",
};

export function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) {
    return (
      <span className="inline-flex rounded-full bg-white/90 px-2.5 py-0.5 text-[12px] font-medium text-muted ring-1 ring-border">
        Ungraded
      </span>
    );
  }

  const style = GRADE_STYLES[grade] ?? "bg-surface text-muted ring-border";
  const name = GRADE_NAMES[grade];

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-semibold ring-1 ring-inset ${style}`}
    >
      Grade {grade}
      {name ? <span className="sr-only">, {name}</span> : null}
    </span>
  );
}
