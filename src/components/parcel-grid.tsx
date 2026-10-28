"use client";

import { ArrowUpRight, Check, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { GradeBadge } from "@/components/grade-badge";
import { ParcelImage } from "@/components/parcel-image";
import { buttonClasses } from "@/components/ui/button";
import { decimalToNumber, formatDate, formatEuro } from "@/lib/format";
import {
  marketingAngle,
  opportunityDisplay,
  reasonPoints,
} from "@/lib/opportunity-display";
import { parseAnalysis } from "@/lib/parse-analysis";
import { estimateValueUplift, formatValueUplift } from "@/lib/value-uplift";

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

function formatSaleDate(value: Date | string | null): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return formatDate(date);
}

function formatArea(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value).toLocaleString("fr-FR")} m²`;
}

const BAR: Record<string, string> = {
  A: "bg-primary",
  B: "bg-amber",
  C: "bg-rose",
};

type GradeFilter = "all" | "A" | "B" | "C" | "ungraded";

export function ParcelGrid({ parcels }: { parcels: ParcelCardData[] }) {
  const [filter, setFilter] = useState<GradeFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const close = useCallback(() => setSelectedId(null), []);

  const filtered = useMemo(() => {
    if (filter === "all") return parcels;
    if (filter === "ungraded") return parcels.filter((parcel) => !parcel.grade);
    return parcels.filter((parcel) => parcel.grade === filter);
  }, [filter, parcels]);

  const selected = parcels.find((parcel) => parcel.id === selectedId) ?? null;

  if (parcels.length === 0) {
    return (
      <div className="ui-card is-dashed px-6 py-14 text-center">
        <p className="text-base font-semibold text-foreground">
          No qualified properties yet
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Properties appear after sale records are checked and non-residential
          addresses are removed.
        </p>
      </div>
    );
  }

  const filters: Array<[GradeFilter, string]> = [
    ["all", "All"],
    ["A", "Grade A"],
    ["B", "Grade B"],
    ["C", "Grade C"],
    ["ungraded", "Ungraded"],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by grade">
        {filters.map(([value, label]) => {
          const count =
            value === "all"
              ? parcels.length
              : value === "ungraded"
                ? parcels.filter((parcel) => !parcel.grade).length
                : parcels.filter((parcel) => parcel.grade === value).length;
          const active = filter === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(value)}
              className={`inline-flex h-8 items-center rounded-md border px-2.5 text-[13px] font-medium ${
                active
                  ? "border-primary/25 bg-primary-soft text-forest"
                  : "border-transparent text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              {label}
              <span className="ml-1.5 tabular-nums text-[12px] opacity-70">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="ui-card is-dashed px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            No properties in this grade
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((parcel) => {
            const parsed = parseAnalysis(parcel.analysis);
            const opportunity = opportunityDisplay(
              parcel.grade,
              parsed.terrace_feasibility,
            );
            const price = decimalToNumber(parcel.sale_price);
            const plot = decimalToNumber(parcel.plot_area);

            return (
              <button
                key={parcel.id}
                type="button"
                onClick={() => setSelectedId(parcel.id)}
                className={`ui-card group overflow-hidden text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_24px_rgba(12,17,23,0.06)] ${
                  selectedId === parcel.id ? "border-primary/40" : ""
                }`}
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                  <ParcelImage
                    parcelNumber={parcel.parcel_number}
                    alt={parcel.address ?? `Property ${parcel.parcel_number}`}
                  />
                  <div className="absolute left-3 top-3">
                    <GradeBadge grade={parcel.grade} />
                  </div>
                  {parsed.source === "vision-ai" ? (
                    <span className="absolute bottom-3 left-3 rounded-md bg-ink/80 px-2 py-1 text-[11px] font-medium text-white">
                      AI review
                    </span>
                  ) : null}
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {parcel.address ?? "Address unavailable"}
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {parcel.municipality} · {parcel.parcel_number}
                  </p>
                  <p className="mt-3 text-sm text-foreground">
                    <span className="font-semibold">
                      {price === null ? "—" : formatEuro(price)}
                    </span>
                    <span className="text-muted">
                      {" "}
                      · {formatSaleDate(parcel.sale_date)}
                    </span>
                  </p>
                  <p className="mt-1 text-[13px] text-muted">
                    Parcel {formatArea(plot)}
                  </p>
                  {parcel.reason ? (
                    <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-muted">
                      {parcel.reason}
                    </p>
                  ) : null}
                  {opportunity ? (
                    <div className="mt-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-[12px] text-muted">Opportunity</p>
                        <p className="text-sm font-semibold tabular-nums text-foreground">
                          {opportunity.score}
                        </p>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface">
                        <div
                          className={`h-full ${BAR[opportunity.tone]}`}
                          style={{ width: `${opportunity.score}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                  <p className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-primary">
                    View analysis
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected ? <ParcelDetail parcel={selected} onClose={close} /> : null}
    </div>
  );
}

function ParcelDetail({
  parcel,
  onClose,
}: {
  parcel: ParcelCardData;
  onClose: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const parsed = parseAnalysis(parcel.analysis);
  const plot = decimalToNumber(parcel.plot_area);
  const house = decimalToNumber(parcel.house_area);
  const backyard =
    plot !== null && house !== null ? Math.max(0, plot - house) : null;
  const price = decimalToNumber(parcel.sale_price);
  const opportunity = opportunityDisplay(parcel.grade, parsed.terrace_feasibility);
  const points = reasonPoints(parcel.reason);
  const uplift = estimateValueUplift(parcel.sale_price);
  const aiReviewed = parsed.source === "vision-ai";

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const facts = [
    ["Municipality", parcel.municipality],
    ["Department", parcel.department],
    ["Section", parcel.section],
    ["Parcel", parcel.parcel_number],
    ["Sale price", price === null ? "—" : formatEuro(price)],
    ["Sale date", formatSaleDate(parcel.sale_date)],
    ["House", formatArea(house)],
    ["Parcel area", formatArea(plot)],
  ];

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        aria-label="Close property analysis"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-y-auto bg-card shadow-2xl outline-none"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card/95 px-5 py-4 backdrop-blur">
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-muted">Property analysis</p>
            <h2 id={titleId} className="mt-1 text-lg font-semibold tracking-tight">
              {parcel.address ?? parcel.parcel_number}
            </h2>
          </div>
          <button
            type="button"
            data-autofocus
            onClick={onClose}
            className={buttonClasses("secondary", "sm")}
          >
            <X className="h-4 w-4" aria-hidden />
            Close
          </button>
        </div>

        <div className="space-y-8 p-5">
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-surface">
            <ParcelImage
              parcelNumber={parcel.parcel_number}
              alt={parcel.address ?? parcel.parcel_number}
            />
            <div className="absolute left-3 top-3">
              <GradeBadge grade={parcel.grade} />
            </div>
          </div>

          <section>
            <h3 className="text-sm font-semibold text-foreground">
              Property overview
            </h3>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              {facts.map(([label, value]) => (
                <div key={label} className="rounded-lg bg-surface px-3 py-2.5">
                  <dt className="text-[12px] text-muted">{label}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-foreground">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-foreground">
              {aiReviewed ? "AI opportunity" : "Opportunity"}
            </h3>
            {opportunity ? (
              <div className="mt-3">
                <p className="text-[32px] font-semibold leading-none tracking-tight">
                  {opportunity.score}
                  <span className="ml-1 text-base font-medium text-muted">/ 100</span>
                </p>
                <p className="mt-2 text-sm text-foreground">{opportunity.headline}</p>
                <p className="mt-1 text-[12px] text-muted">
                  Based on the property grade
                  {parsed.terrace_feasibility
                    ? " and site analysis"
                    : ""}
                  .
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface">
                  <div
                    className={`h-full ${BAR[opportunity.tone]}`}
                    style={{ width: `${opportunity.score}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">
                An opportunity reading appears once this property is graded.
              </p>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-foreground">
              Satellite analysis
            </h3>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Open outdoor space", parsed.free_backyard_area ?? formatArea(backyard)],
                ["Terrain", parsed.terrain_slope ?? "—"],
                ["Vegetation", parsed.vegetation_density ?? "—"],
                ["Terrace feasibility", parsed.terrace_feasibility ?? "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[12px] text-muted">{label}</dt>
                  <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-foreground">
              Why this property ranked here
            </h3>
            {points.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {points.map((point) => (
                  <li key={point} className="flex gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    {point}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">
                A written rationale appears after scoring.
              </p>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-foreground">
              Parcel characteristics
            </h3>
            <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
              {[
                ["House", formatArea(house)],
                ["Parcel", formatArea(plot)],
                ["Yard", formatArea(backyard)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-surface px-3 py-2.5">
                  <dt className="text-[12px] text-muted">{label}</dt>
                  <dd className="mt-0.5 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-foreground">
              Recommended marketing angle
            </h3>
            <p className="mt-2 text-sm leading-6 text-foreground">
              {marketingAngle(parcel.grade)}
            </p>
            {uplift !== null ? (
              <p className="mt-2 text-[13px] text-muted">
                Estimated terrace value uplift {formatValueUplift(uplift)}.
              </p>
            ) : null}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-foreground">Before / after</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <figure className="overflow-hidden rounded-xl border border-border">
                <div className="aspect-square bg-surface">
                  <ParcelImage
                    parcelNumber={parcel.parcel_number}
                    alt="Satellite view before a terrace"
                    variant="before"
                  />
                </div>
                <figcaption className="border-t border-border px-3 py-2 text-[12px] font-medium">
                  Before · satellite
                </figcaption>
              </figure>
              <figure className="overflow-hidden rounded-xl border border-border">
                <div className="aspect-square bg-surface">
                  <ParcelImage
                    parcelNumber={parcel.parcel_number}
                    alt="Terrace visualization"
                    variant="after"
                  />
                </div>
                <figcaption className="border-t border-border px-3 py-2 text-[12px] font-medium">
                  After · terrace
                </figcaption>
              </figure>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
