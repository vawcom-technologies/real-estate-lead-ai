import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";

export type ActivityItem = {
  id: string;
  postcode: string;
  agent_name: string;
  status: string;
  parcelCount: number;
  created_at: Date;
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function activityMessage(status: string, parcelCount: number): string {
  switch (status) {
    case "completed":
      return `Completed — ${parcelCount} parcels qualified, exports ready`;
    case "running":
      return "Processing pipeline — extraction, validation, imagery, scoring…";
    case "pending":
      return "Queued in Redis — waiting for worker";
    case "failed":
      return "Processing failed — check worker and Redis";
    default:
      return `Status: ${status}`;
  }
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="surface-card p-6">
        <h3 className="text-sm font-semibold text-foreground">Recent activity</h3>
        <p className="mt-4 text-sm text-muted">No recent activity.</p>
      </div>
    );
  }

  return (
    <div className="surface-card p-6">
      <h3 className="text-sm font-semibold text-foreground">Recent activity</h3>
      <ul className="mt-4 space-y-4">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={`/campaigns/${item.id}`} className="flex gap-3 group">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary">
                    {item.postcode} — {item.agent_name}
                  </p>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {activityMessage(item.status, item.parcelCount)}
                </p>
                <p className="mt-1 text-[11px] text-muted/70">
                  {timeAgo(item.created_at)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
