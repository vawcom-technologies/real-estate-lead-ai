import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

const STATUSES = [
  { value: "", label: "Any status" },
  { value: "pending", label: "Pending" },
  { value: "running", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

export function CampaignFilters({
  q,
  status,
  postcode,
  agent,
  from,
  to,
  active,
}: {
  q: string;
  status: string;
  postcode: string;
  agent: string;
  from: string;
  to: string;
  active: boolean;
}) {
  return (
    <form
      action="/campaigns"
      method="get"
      className="ui-card grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-6"
    >
      {q ? <input type="hidden" name="q" value={q} /> : null}
      <label className="flex flex-col gap-1.5 text-[12px] font-medium text-muted">
        Status
        <select name="status" defaultValue={status} className="ui-input">
          {STATUSES.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-[12px] font-medium text-muted">
        Postcode
        <input
          name="postcode"
          defaultValue={postcode}
          placeholder="33290"
          className="ui-input"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-[12px] font-medium text-muted">
        Agent
        <input
          name="agent"
          defaultValue={agent}
          placeholder="Agent name"
          className="ui-input"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-[12px] font-medium text-muted">
        From
        <input type="date" name="from" defaultValue={from} className="ui-input" />
      </label>
      <label className="flex flex-col gap-1.5 text-[12px] font-medium text-muted">
        To
        <input type="date" name="to" defaultValue={to} className="ui-input" />
      </label>
      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium text-transparent select-none" aria-hidden>
          Apply
        </span>
        <div className="flex items-center gap-2">
          <button type="submit" className={buttonClasses("primary", "md")}>
            Apply
          </button>
          {active ? (
            <Link href="/campaigns" className={buttonClasses("ghost", "md")}>
              Reset
            </Link>
          ) : null}
        </div>
      </div>
    </form>
  );
}
