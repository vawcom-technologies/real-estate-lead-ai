import Link from "next/link";
import { CreateCampaignForm } from "@/components/create-campaign-form";

export default function NewCampaignPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/campaigns"
          className="text-sm font-medium text-muted hover:text-foreground"
        >
          ← Back to campaigns
        </Link>
        <h1 className="font-display mt-3 text-3xl tracking-tight text-foreground">
          Launch campaign
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Enter a postcode, minimum price, and agent details. The Redis worker
          runs extraction, validation, imagery, scoring, and marketing exports
          automatically.
        </p>
      </div>
      <CreateCampaignForm />
    </div>
  );
}
