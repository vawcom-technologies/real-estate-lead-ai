"use client";

import { useMemo, useState } from "react";
import { GradeBadge } from "@/components/grade-badge";
import { ParcelImage } from "@/components/parcel-image";
import { parseAnalysis } from "@/lib/parse-analysis";
import { estimateValueUplift } from "@/lib/value-uplift";

export type ParcelCardData = {
  id: string;
  parcel_number: string;
  department: string;
  section: string;
  address: string | null;
  municipality: string;
  grade: string | null;
  reason: string | null;
  analysis: string | null;
  sale_price: { toString(): string } | number | null;
  sale_date: Date | string | null;
  plot_area: { toString(): string } | number | null;
  house_area: { toString(): string } | number | null;
};

function toNumber(value: { toString(): string } | number | null): number | null {
  if (value === null) return null;
  const n = Number(value.toString());
  return Number.isFinite(n) ? n : null;
}

function formatPrice(value: { toString(): string } | number | null): string {
  const n = toNumber(value);
  if (n === null) return "—";
  return `€${n.toLocaleString("fr-FR")}`;
}

function formatDate(value: Date | string | null): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR");
}

type GradeFilter = "all" | "A" | "B" | "C" | "ungraded";

export function ParcelGrid({ parcels }: { parcels: ParcelCardData[] }) {
  const [filter, setFilter] = useState<GradeFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return parcels;
    if (filter === "ungraded") return parcels.filter((p) => !p.grade);
    return parcels.filter((p) => p.grade === filter);
  }, [filter, parcels]);

  const selected = parcels.find((p) => p.id === selectedId) ?? null;

  if (parcels.length === 0) {
    return (
      <div className="surface-card border-dashed px-8 py-14 text-center">
        <p className="text-base font-medium text-foreground">
          No qualified parcels yet
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Parcels appear after DVF extraction and residential address
          validation. Non-residential addresses are rejected during qualification.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["all", "All"],
            ["A", "Grade A"],
            ["B", "Grade B"],
            ["C", "Grade C"],
            ["ungraded", "Ungraded"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === value
                ? "bg-primary text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            {label}
            <span className="ml-1.5 opacity-70">
              {value === "all"
                ? parcels.length
                : value === "ungraded"
                  ? parcels.filter((p) => !p.grade).length
                  : parcels.filter((p) => p.grade === value).length}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((parcel) => {
          const plot = toNumber(parcel.plot_area);
          const house = toNumber(parcel.house_area);
          const backyard =
            plot !== null && house !== null ? Math.max(0, plot - house) : null;
          const parsed = parseAnalysis(parcel.analysis);

          return (
            <button
              key={parcel.id}
              type="button"
              onClick={() => setSelectedId(parcel.id)}
              className="surface-card overflow-hidden text-left transition-transform hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                <ParcelImage
                  parcelNumber={parcel.parcel_number}
                  alt={parcel.address ?? parcel.parcel_number}
                />
                <div className="absolute left-3 top-3">
                  <GradeBadge grade={parcel.grade} />
                </div>
                {parsed.source ? (
                  <span className="absolute bottom-3 left-3 rounded-md bg-black/55 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
                    {parsed.source === "vision-ai" ? "AI vision" : parsed.source}
                  </span>
                ) : null}
              </div>
              <div className="p-4">
                <p className="font-semibold text-foreground">
                  {parcel.address ?? "No address"}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {parcel.municipality} · {parcel.parcel_number}
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {formatPrice(parcel.sale_price)}
                </p>
                {parcel.reason ? (
                  <p className="mt-2 line-clamp-2 text-sm text-muted">
                    {parcel.reason}
                  </p>
                ) : null}
                <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <dt className="text-muted">Plot</dt>
                    <dd className="font-medium">{plot ? `${plot} m²` : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">House</dt>
                    <dd className="font-medium">{house ? `${house} m²` : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Yard</dt>
                    <dd className="font-medium">
                      {backyard !== null ? `${Math.round(backyard)} m²` : "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            </button>
          );
        })}
      </div>

      {selected ? (
        <ParcelDetailDrawer
          parcel={selected}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  );
}

function ParcelDetailDrawer({
  parcel,
  onClose,
}: {
  parcel: ParcelCardData;
  onClose: () => void;
}) {
  const parsed = parseAnalysis(parcel.analysis);
  const plot = toNumber(parcel.plot_area);
  const house = toNumber(parcel.house_area);
  const backyard =
    plot !== null && house !== null ? Math.max(0, plot - house) : null;
  const uplift = estimateValueUplift(parcel.sale_price);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close parcel details"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-card shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Parcel detail
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              {parcel.address ?? parcel.parcel_number}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-surface"
          >
            Close
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-surface">
            <ParcelImage
              parcelNumber={parcel.parcel_number}
              alt={parcel.address ?? parcel.parcel_number}
            />
            <div className="absolute left-3 top-3">
              <GradeBadge grade={parcel.grade} />
            </div>
          </div>

          <section>
            <h3 className="text-sm font-semibold text-foreground">Cadastre & sale</h3>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Municipality", parcel.municipality],
                ["Department", parcel.department],
                ["Section", parcel.section],
                ["Parcel ID", parcel.parcel_number],
                ["Sale price", formatPrice(parcel.sale_price)],
                ["Sale date", formatDate(parcel.sale_date)],
                ["House area", house ? `${house} m²` : "—"],
                ["Plot area", plot ? `${plot} m²` : "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-surface px-3 py-3">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="mt-1 font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-foreground">
              Scoring & AI analysis
            </h3>
            <div className="mt-3 rounded-2xl border border-border bg-background p-4">
              <p className="text-sm font-medium text-foreground">
                {parcel.reason ?? "No reason recorded yet"}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted">Estimated backyard</dt>
                  <dd className="font-medium">
                    {parsed.free_backyard_area ??
                      (backyard !== null ? `${Math.round(backyard)} m²` : "—")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Terrain slope</dt>
                  <dd className="font-medium">{parsed.terrain_slope ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Vegetation</dt>
                  <dd className="font-medium">
                    {parsed.vegetation_density ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Terrace feasibility</dt>
                  <dd className="font-medium">
                    {parsed.terrace_feasibility ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Analysis source</dt>
                  <dd className="font-medium">{parsed.source ?? "rule-based"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Vision model</dt>
                  <dd className="font-medium">{parsed.model ?? "—"}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-foreground">
              Before / after
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="overflow-hidden rounded-2xl border border-border">
                <div className="aspect-square bg-surface">
                  <ParcelImage
                    parcelNumber={parcel.parcel_number}
                    alt="Before satellite"
                    variant="before"
                  />
                </div>
                <p className="border-t border-border px-3 py-2 text-xs font-medium">
                  Before · satellite
                </p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border">
                <div className="aspect-square bg-surface">
                  <ParcelImage
                    parcelNumber={parcel.parcel_number}
                    alt="After terrace render"
                    variant="after"
                  />
                </div>
                <p className="border-t border-border px-3 py-2 text-xs font-medium">
                  After · AI terrace
                  {uplift !== null
                    ? ` · +€${uplift.toLocaleString("fr-FR")}`
                    : ""}
                </p>
              </div>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
