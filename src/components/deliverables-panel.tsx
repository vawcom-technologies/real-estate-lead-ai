import { CampaignDownloadButton } from "@/components/campaign-download-button";

export function DeliverablesPanel({
  campaignId,
  status,
  parcelCount,
}: {
  campaignId: string;
  status: string;
  parcelCount: number;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Campaign assets
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Property reports are included in the campaign package. Files stay
          marked as preparing until analysis finishes.
        </p>
      </div>
      <CampaignDownloadButton
        campaignId={campaignId}
        status={status}
        parcelCount={parcelCount}
      />
    </section>
  );
}
