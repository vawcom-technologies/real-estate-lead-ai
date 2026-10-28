import type { GradeCounts } from "@/lib/campaign-insights";
import { LeadQuality } from "@/components/lead-quality";

export function GradeBreakdown({ grades }: { grades: GradeCounts }) {
  return (
    <LeadQuality
      grades={grades}
      description="Distribution after scoring and AI analysis."
    />
  );
}
