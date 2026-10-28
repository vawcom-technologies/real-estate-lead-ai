import { Download, FolderKanban, House, Sparkles } from "lucide-react";
import { LeadQuality } from "@/components/lead-quality";
import { StatCard } from "@/components/ui/stat-card";
import type { DashboardStats as DashboardStatsData } from "@/lib/dashboard-stats";
import { formatNumber } from "@/lib/format";

export function DashboardStats({ stats }: { stats: DashboardStatsData }) {
  const cards = [
    {
      key: "active",
      label: "Active campaigns",
      value: formatNumber(stats.activeCampaigns),
      detail:
        stats.runningCount > 0
          ? `${formatNumber(stats.runningCount)} in analysis now`
          : "None in analysis right now",
      icon: <FolderKanban className="h-4 w-4" />,
      status: stats.runningCount > 0 ? "Processing" : "Ready",
    },
    {
      key: "qualified",
      label: "Qualified properties",
      value: formatNumber(stats.parcelsScanned),
      detail: "Residential parcels kept after validation",
      icon: <House className="h-4 w-4" />,
    },
    {
      key: "high",
      label: "High-potential leads",
      value: formatNumber(stats.gradeA),
      detail: "Grade A — strongest sales opportunities",
      icon: <Sparkles className="h-4 w-4" />,
    },
    {
      key: "exports",
      label: "Exports ready",
      value: formatNumber(stats.exportsCompleted),
      detail: "Completed campaigns with assets",
      icon: <Download className="h-4 w-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard
          key={card.key}
          label={card.label}
          value={card.value}
          detail={card.detail}
          icon={card.icon}
          status={card.status}
        />
      ))}
    </div>
  );
}

export function GradeSummary({ stats }: { stats: DashboardStatsData }) {
  return (
    <LeadQuality
      grades={{ A: stats.gradeA, B: stats.gradeB, C: stats.gradeC }}
    />
  );
}
