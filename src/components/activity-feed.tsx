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
      return `Analysis complete — ${parcelCount} properties qualified`;
    case "running":
      return "Property analysis is in progress";
    case "pending":
      return "Campaign is queued and will start shortly";
    case "failed":
      return "Analysis did not finish. Open the campaign for details.";
    default:
      return `Status: ${status}`;
  }
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <section className="ui-card p-6">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        Recent activity
      </h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No campaigns yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/campaigns/${item.id}`} className="group block">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground group-hover:text-primary">
                    {item.postcode}
                  </span>
                  <StatusBadge status={item.status} />
                </span>
                <span className="mt-1 block text-[13px] leading-5 text-muted">
                  {item.agent_name} · {activityMessage(item.status, item.parcelCount)}
                </span>
                <span className="mt-1 block text-[12px] text-muted">
                  {timeAgo(item.created_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
