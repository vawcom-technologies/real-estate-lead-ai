export type OpportunityDisplay = {
  score: number;
  headline: string;
  tone: "A" | "B" | "C";
};

/** Presentation index derived from the stored grade and site notes. */
export function opportunityDisplay(
  grade: string | null,
  feasibility?: string | null,
): OpportunityDisplay | null {
  if (grade !== "A" && grade !== "B" && grade !== "C") return null;

  const base = grade === "A" ? 86 : grade === "B" ? 64 : 36;
  const text = feasibility?.toLowerCase() ?? "";
  let score = base;
  if (text.includes("high")) score += 6;
  else if (text.includes("low")) score -= 8;

  const headline =
    grade === "A"
      ? "Strong terrace conversion opportunity"
      : grade === "B"
        ? "Possible terrace opportunity"
        : "Limited terrace opportunity";

  return {
    score: Math.max(18, Math.min(96, score)),
    headline,
    tone: grade,
  };
}

export function marketingAngle(grade: string | null): string {
  if (grade === "A") {
    return "Lead with a terrace transformation and the estimated value uplift on this sale.";
  }
  if (grade === "B") {
    return "Offer a measured outdoor upgrade to an owner with usable space and a recent transaction.";
  }
  if (grade === "C") {
    return "Keep for reference. Direct outreach is a lower priority than higher-graded properties.";
  }
  return "A marketing angle is available once this property has been graded.";
}

export function reasonPoints(reason: string | null): string[] {
  if (!reason) return [];
  return reason
    .split(/;|\n/)
    .map((part) => part.trim().replace(/[.;]$/, ""))
    .filter((part) => part.length > 1);
}
