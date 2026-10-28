import { CAMPAIGN_STATUS } from "@/lib/campaign-status";

const STATUS_STYLES: Record<
  string,
  { dot: string; bg: string; text: string; label: string }
> = {
  [CAMPAIGN_STATUS.completed]: {
    dot: "bg-primary",
    bg: "bg-primary-soft",
    text: "text-forest",
    label: "Completed",
  },
  [CAMPAIGN_STATUS.running]: {
    dot: "bg-primary animate-pulse",
    bg: "bg-primary-soft",
    text: "text-forest",
    label: "Processing",
  },
  [CAMPAIGN_STATUS.pending]: {
    dot: "bg-amber",
    bg: "bg-accent-soft",
    text: "text-amber",
    label: "Pending",
  },
  [CAMPAIGN_STATUS.failed]: {
    dot: "bg-danger",
    bg: "bg-danger/10",
    text: "text-danger",
    label: "Failed",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? {
    dot: "bg-muted",
    bg: "bg-surface",
    text: "text-muted",
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${style.bg} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden />
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
      ? "bg-primary"
      : status === CAMPAIGN_STATUS.running
        ? "bg-primary"
        : status === CAMPAIGN_STATUS.pending
          ? "bg-amber"
          : "bg-danger";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Campaign progress"
      >
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs text-muted">{value}%</span>
    </div>
  );
}
