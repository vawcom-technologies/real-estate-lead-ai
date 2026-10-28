"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { formatCampaignStage } from "@/lib/campaign-status";

/** Auto-refresh campaign pages while processing. */
export function CampaignStatusPoller({
  campaignId,
  status,
  stage,
}: {
  campaignId: string;
  status: string;
  stage?: string | null;
}) {
  const router = useRouter();
  const shouldPoll = status === "pending" || status === "running";
  const stageLabel = formatCampaignStage(stage);

  useEffect(() => {
    if (!shouldPoll) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/status`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          status?: string;
          stage?: string | null;
        };
        if (
          (data.status && data.status !== status) ||
          (data.stage ?? null) !== (stage ?? null)
        ) {
          router.refresh();
        }
      } catch {
        // Ignore transient network errors while polling.
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [campaignId, router, shouldPoll, status, stage]);

  if (!shouldPoll) return null;

  return (
    <div
      className="flex flex-col gap-1 rounded-xl border border-primary/20 bg-primary-soft px-4 py-3 text-sm text-forest sm:flex-row sm:items-center sm:gap-3"
      role="status"
    >
      <span className="flex items-center gap-2 font-medium">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
        {stageLabel ?? "Preparing campaign"}
      </span>
      <span className="text-forest/70">
        This page updates as analysis moves forward.
      </span>
    </div>
  );
}
