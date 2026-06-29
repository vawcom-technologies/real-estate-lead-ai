import { CreateCampaignForm } from "@/components/create-campaign-form";
import { CampaignList } from "@/components/campaign-list";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="min-h-full bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-xl items-center px-6 py-5">
          <h1 className="text-base font-semibold tracking-tight text-stone-900">
            Terrace Prospector
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-6 py-12">
        <CreateCampaignForm />
        <CampaignList />
      </main>
    </div>
  );
}
