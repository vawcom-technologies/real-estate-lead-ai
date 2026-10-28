import { Database, Map, MapPin, Satellite } from "lucide-react";
import { IntegrationsPanel } from "@/components/integrations-panel";
import { PageHeader } from "@/components/ui/page-header";
import { getIntegrationStatuses } from "@/lib/integrations";

export const dynamic = "force-dynamic";

const INCLUDED = [
  {
    name: "DVF",
    description: "Official sale records used to find recent house transactions.",
    icon: Database,
  },
  {
    name: "Cadastre",
    description: "Parcel boundaries, sections, and plot context.",
    icon: Map,
  },
  {
    name: "BAN",
    description: "French address checks that keep residential properties.",
    icon: MapPin,
  },
  {
    name: "Satellite imagery",
    description: "Aerial photography used for site analysis and marketing visuals.",
    icon: Satellite,
  },
];

const COPY: Record<string, string> = {
  postgres: "Workspace database",
  redis: "Background processing",
  "google-maps": "Google Maps",
  "openai-vision": "AI analysis",
  "openai-images": "Visual generation",
  "cloudflare-r2": "Asset storage",
};

export default function SettingsPage() {
  const statuses = getIntegrationStatuses();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Settings"
        title="Integrations"
        description="Services that power address checks, imagery, and AI analysis. Secrets are never displayed."
      />

      <section>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Included sources
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          These public sources are part of every campaign.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {INCLUDED.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name} className="ui-card flex gap-3 px-4 py-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-muted">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {item.name}
                    </span>
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-forest">
                      Included
                    </span>
                  </span>
                  <span className="mt-1 block text-[13px] leading-5 text-muted">
                    {item.description}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <IntegrationsPanel statuses={statuses} />

      <details className="ui-card px-5 py-4">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          Setup reference
        </summary>
        <p className="mt-2 text-[13px] leading-5 text-muted">
          Configuration names for the operator. Values are not shown.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[12px] text-muted">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Service</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {statuses.map((item) => (
                <tr key={`${item.id}-${item.envVar}`}>
                  <td className="py-3 pr-4 font-mono text-xs text-muted">
                    {item.envVar}
                  </td>
                  <td className="py-3 pr-4">{COPY[item.id] ?? item.name}</td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        item.configured
                          ? "bg-primary-soft text-forest"
                          : "bg-accent-soft text-amber"
                      }`}
                    >
                      {item.configured ? "Configured" : "Needs setup"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {process.env.NODE_ENV === "development" ? (
          <p className="mt-4 text-[12px] leading-5 text-muted">
            Development note: restart the app after changing configuration so
            new campaigns pick it up. Background analysis must be available for
            campaigns to leave the pending state.
          </p>
        ) : null}
      </details>
    </div>
  );
}
