import { CreateCampaignForm } from "@/components/create-campaign-form";
import { Breadcrumb, PageHeader } from "@/components/ui/page-header";

export default function NewCampaignPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <div className="space-y-4">
        <Breadcrumb
          items={[
            { href: "/campaigns", label: "Campaigns" },
            { label: "New campaign" },
          ]}
        />
        <PageHeader
          title="New campaign"
          description="Set the search area, price floor, and the agent who should appear on the marketing assets."
        />
      </div>
      <CreateCampaignForm />
    </div>
  );
}
