const GRADE_STYLES: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  B: "bg-amber-100 text-amber-800 ring-amber-200",
  C: "bg-red-100 text-red-800 ring-red-200",
};

export function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) {
    return (
      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
        —
      </span>
    );
  }

  const style = GRADE_STYLES[grade] ?? "bg-gray-100 text-gray-600 ring-gray-200";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${style}`}
    >
      Grade {grade}
    </span>
  );
}
