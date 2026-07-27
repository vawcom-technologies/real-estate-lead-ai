"use client";

import Link from "next/link";
import { canDownloadExport } from "@/lib/campaign-status";

type CampaignDownloadButtonProps = {
  campaignId: string;
  status: string;
  parcelCount?: number;
  compact?: boolean;
};

function ProcessingMessage({ status }: { status: string }) {
  const messages: Record<string, { title: string; detail: string }> = {
    pending: {
      title: "Waiting in queue",
      detail: "The worker will start processing shortly.",
    },
    running: {
      title: "Processing campaign",
      detail:
        "Extracting parcels → analyzing → visuals → postcards → packaging…",
    },
    failed: {
      title: "Processing failed",
      detail: "Check that Redis and the worker are running.",
    },
  };

  const message = messages[status] ?? {
    title: "Not available",
    detail: "Exports are not ready for this campaign.",
  };

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <p className="text-sm font-medium text-foreground">{message.title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-muted">{message.detail}</p>
    </div>
  );
}

function DownloadLink({
  href,
  title,
  subtitle,
  variant,
}: {
  href: string;
  title: string;
  subtitle: string;
  variant: "secondary" | "primary";
}) {
  const styles =
    variant === "primary"
      ? "border-primary bg-primary text-white hover:bg-primary-hover"
      : "border-border bg-white text-foreground hover:border-primary/30 hover:bg-primary-soft/40";

  return (
    <a
      href={href}
      className={`flex flex-col rounded-xl border px-4 py-3 transition-colors ${styles}`}
    >
      <span className="text-sm font-semibold">{title}</span>
      <span
        className={`mt-0.5 text-xs ${variant === "primary" ? "text-white/80" : "text-muted"}`}
      >
        {subtitle}
      </span>
    </a>
  );
}

export function CampaignDownloadButton({
  campaignId,
  status,
  parcelCount = 0,
  compact = false,
}: CampaignDownloadButtonProps) {
  const ready = canDownloadExport(status);

  if (!ready) {
    if (compact) {
      return <ProcessingMessage status={status} />;
    }

    return (
      <div className="space-y-3">
        <ProcessingMessage status={status} />
        <Link
          href={`/campaigns/${campaignId}`}
          className="inline-flex text-sm font-medium text-primary hover:text-primary-hover"
        >
          View campaign details →
        </Link>
      </div>
    );
  }

  const emptyNote =
    parcelCount === 0 ? " · No parcels matched your filters" : "";

  if (compact) {
    return (
      <div className="flex min-w-[200px] flex-col gap-2">
        <Link
          href={`/campaigns/${campaignId}`}
          className="text-sm font-medium text-primary hover:text-primary-hover"
        >
          View details →
        </Link>
        <div className="flex flex-col gap-1.5">
          <a
            href={`/api/campaigns/${campaignId}/export`}
            download={`parcels.xlsx`}
            className="rounded-lg border border-border bg-white px-3 py-2 text-left text-xs transition-colors hover:bg-gray-50"
          >
            <span className="font-semibold text-foreground">parcels.xlsx</span>
            <span className="mt-0.5 block text-muted">Excel · grades & analysis</span>
          </a>
          <a
            href={`/api/campaigns/${campaignId}/export/package`}
            download={`campaign_${campaignId}_marketing.zip`}
            className="rounded-lg border border-primary/20 bg-primary-soft px-3 py-2 text-left text-xs transition-colors hover:bg-primary/10"
          >
            <span className="font-semibold text-primary">Full marketing kit</span>
            <span className="mt-0.5 block text-primary/70">ZIP · all assets</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Download assets{emptyNote}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <DownloadLink
          href={`/api/campaigns/${campaignId}/export`}
          title="parcels.xlsx"
          subtitle="Spreadsheet · parcels, grades, analysis"
          variant="secondary"
        />
        <DownloadLink
          href={`/api/campaigns/${campaignId}/export/assets?kind=before`}
          title="before_images.zip"
          subtitle="Satellite JPEGs per parcel"
          variant="secondary"
        />
        <DownloadLink
          href={`/api/campaigns/${campaignId}/export/assets?kind=after`}
          title="after_images.zip"
          subtitle="AI terrace visualizations"
          variant="secondary"
        />
        <DownloadLink
          href={`/api/campaigns/${campaignId}/export/assets?kind=postcards`}
          title="postcards.zip"
          subtitle="BEFORE | AFTER PDFs with agent contact"
          variant="secondary"
        />
        <div className="sm:col-span-2">
          <DownloadLink
            href={`/api/campaigns/${campaignId}/export/package`}
            title="Full marketing kit"
            subtitle="ZIP · Excel, postcards, reports, before/after images"
            variant="primary"
          />
        </div>
      </div>
    </div>
  );
}
