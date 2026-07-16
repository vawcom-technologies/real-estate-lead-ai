"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Auto-refresh campaign pages while processing. */
export function CampaignStatusPoller({
  campaignId,
  status,
}: {
  campaignId: string;
  status: string;
}) {
  const router = useRouter();
  const shouldPoll = status === "pending" || status === "running";

  useEffect(() => {
    if (!shouldPoll) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/status`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as { status?: string };
        if (data.status && data.status !== status) {
          router.refresh();
        }
      } catch {
        // Ignore transient network errors while polling.
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [campaignId, router, shouldPoll, status]);

  if (!shouldPoll) return null;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary-soft px-4 py-3 text-sm text-primary">
      <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
      Live updates every few seconds while the worker processes this campaign.
    </div>
  );
}
