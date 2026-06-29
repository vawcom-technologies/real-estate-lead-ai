"use client";

import { canDownloadExport } from "@/lib/campaign-status";

type CampaignDownloadButtonProps = {
  campaignId: string;
  status: string;
  parcelCount?: number;
};

export function CampaignDownloadButton({
  campaignId,
  status,
  parcelCount = 0,
}: CampaignDownloadButtonProps) {
  const href = `/api/campaigns/${campaignId}/export`;
  const ready = canDownloadExport(status);
  const disabled = !ready;

  let label = "Download Excel";
  if (status === "pending") {
    label = "Queued…";
  } else if (status === "running") {
    label = "Processing…";
  } else if (status === "failed") {
    label = "Processing failed";
  } else if (ready && parcelCount === 0) {
    label = "Download Excel (empty)";
  }

  return (
    <a
      href={disabled ? undefined : href}
      download={`campaign_${campaignId}.xlsx`}
      aria-disabled={disabled}
      className={`inline-flex w-full items-center justify-center rounded-md border px-4 py-2.5 text-sm font-medium transition-colors ${
        disabled
          ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400"
          : "border-stone-300 bg-white text-stone-900 hover:bg-stone-50"
      }`}
    >
      {label}
    </a>
  );
}
