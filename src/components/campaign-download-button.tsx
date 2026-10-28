import {
  Download,
  FileSpreadsheet,
  Image as ImageIcon,
  Mail,
  Satellite,
} from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { campaignAssets } from "@/lib/campaign-assets";
import { canDownloadExport } from "@/lib/campaign-status";

const ICONS = {
  excel: FileSpreadsheet,
  before: Satellite,
  after: ImageIcon,
  postcards: Mail,
  package: Download,
} as const;

function assetState(status: string): { label: string; ready: boolean } {
  if (canDownloadExport(status)) return { label: "Ready", ready: true };
  if (status === "failed") return { label: "Unavailable", ready: false };
  return { label: "Preparing", ready: false };
}

export function CampaignDownloadButton({
  campaignId,
  status,
  parcelCount = 0,
}: {
  campaignId: string;
  status: string;
  parcelCount?: number;
  compact?: boolean;
}) {
  const state = assetState(status);
  const assets = campaignAssets(campaignId);

  return (
    <div className="space-y-3">
      {parcelCount === 0 && state.ready ? (
        <p className="text-[13px] text-muted">
          No properties matched this search. The files are still available.
        </p>
      ) : null}
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
        {assets.map((asset) => {
          const Icon = ICONS[asset.id as keyof typeof ICONS] ?? Download;
          return (
            <li
              key={asset.id}
              className="flex flex-col gap-3 bg-white px-4 py-3 sm:flex-row sm:items-center"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-muted">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">
                  {asset.type}
                </span>
                <span className="mt-0.5 block text-[12px] text-muted">
                  {asset.filename} · {asset.detail}
                </span>
              </span>
              {state.ready ? (
                <a
                  href={asset.href}
                  download={asset.download}
                  className={buttonClasses("secondary", "sm")}
                >
                  Download
                </a>
              ) : (
                <span className="text-[12px] font-medium text-muted">
                  {state.label}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
