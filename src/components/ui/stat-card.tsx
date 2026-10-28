import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  detail,
  icon,
  status,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  status?: string;
}) {
  return (
    <article className="ui-card p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <span className="text-muted" aria-hidden>
          {icon}
        </span>
      </div>
      <p className="mt-4 text-[32px] font-semibold leading-none tracking-tight text-foreground">
        {value}
      </p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[13px] leading-5 text-muted">{detail}</p>
        {status ? (
          <span className="shrink-0 text-[12px] font-medium text-primary">
            {status}
          </span>
        ) : null}
      </div>
    </article>
  );
}
