import { CAMPAIGN_STATUS } from "@/lib/campaign-status";

const STATUS_STYLES: Record<
  string,
  { dot: string; bg: string; text: string; label: string }
> = {
  [CAMPAIGN_STATUS.completed]: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    label: "Completed",
  },
  [CAMPAIGN_STATUS.running]: {
    dot: "bg-primary",
    bg: "bg-primary-soft",
    text: "text-primary",
    label: "Running",
  },
  [CAMPAIGN_STATUS.pending]: {
    dot: "bg-amber-400",
    bg: "bg-amber-50",
    text: "text-amber-700",
    label: "Queued",
  },
  [CAMPAIGN_STATUS.failed]: {
    dot: "bg-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
    label: "Failed",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? {
    dot: "bg-gray-400",
    bg: "bg-gray-50",
    text: "text-gray-600",
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

export function campaignProgress(status: string): number {
  switch (status) {
    case CAMPAIGN_STATUS.completed:
      return 100;
    case CAMPAIGN_STATUS.running:
      return 62;
    case CAMPAIGN_STATUS.pending:
      return 18;
    case CAMPAIGN_STATUS.failed:
      return 0;
    default:
      return 0;
  }
}

export function ProgressBar({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}) {
  const value = campaignProgress(status);
  const color =
    status === CAMPAIGN_STATUS.completed
      ? "bg-emerald-500"
      : status === CAMPAIGN_STATUS.running
        ? "bg-primary"
        : status === CAMPAIGN_STATUS.pending
          ? "bg-amber-400"
          : "bg-red-400";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs text-muted">{value}%</span>
    </div>
  );
}
