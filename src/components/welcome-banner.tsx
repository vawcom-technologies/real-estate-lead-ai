import Link from "next/link";

export function WelcomeBanner({
  runningCount,
  integrationsReady,
  configuredIntegrations,
  totalIntegrations,
}: {
  runningCount: number;
  integrationsReady: boolean;
  configuredIntegrations: number;
  totalIntegrations: number;
}) {
  return (
    <section className="mesh-panel animate-fade-up overflow-hidden rounded-[1.75rem] px-8 py-8 shadow-xl shadow-primary/10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            {runningCount > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                {runningCount} campaign{runningCount === 1 ? "" : "s"} processing
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                Worker idle · ready to launch
              </span>
            )}
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                integrationsReady
                  ? "bg-emerald-400/20 text-emerald-100"
                  : "bg-accent/20 text-accent-soft"
              }`}
            >
              APIs {configuredIntegrations}/{totalIntegrations}
            </span>
          </div>

          <h1 className="font-display mt-5 text-3xl tracking-tight text-white sm:text-4xl">
            Terracea
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
            Prospect French house sales, validate residential parcels, score
            terrace potential with satellite AI, and export marketing-ready
            packages — from one command center.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/campaigns/new"
              className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-sidebar transition-colors hover:bg-accent-soft"
            >
              Launch campaign
            </Link>
            <Link
              href="/campaigns"
              className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Browse campaigns
            </Link>
            <Link
              href="/exports"
              className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Exports library
            </Link>
          </div>
        </div>

        <div className="grid w-full max-w-sm grid-cols-2 gap-3">
          {[
            { label: "Phase 1–2", value: "Live", detail: "Extract → score" },
            { label: "Phase 3", value: "Next", detail: "Before / after AI" },
            { label: "Phase 4", value: "Live", detail: "Postcard factory" },
            { label: "Phase 5", value: "Soon", detail: "Auth & maps" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                {item.label}
              </p>
              <p className="mt-1 text-lg font-semibold text-white">{item.value}</p>
              <p className="text-xs text-white/55">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
