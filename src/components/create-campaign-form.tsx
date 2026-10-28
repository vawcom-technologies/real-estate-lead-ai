"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import {
  createCampaign,
  type CreateCampaignState,
} from "@/app/actions/campaign";
import { CampaignDownloadButton } from "@/components/campaign-download-button";
import { StatusBadge } from "@/components/status-badge";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { decimalToNumber, formatEuro } from "@/lib/format";

const initialState: CreateCampaignState = {};

const LAUNCH_STEPS = [
  "Fetching transactions",
  "Validating properties",
  "Analyzing parcels",
  "Running AI scoring",
  "Preparing campaign assets",
];

const INCLUDED = [
  "Residential houses only",
  "Plots from 80 m²",
  "Sale record verification",
  "Satellite analysis",
  "Opportunity scoring",
  "Spreadsheet and marketing assets",
];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonClasses("primary", "lg", "w-full sm:w-auto")}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Preparing campaign…
        </>
      ) : (
        "Launch intelligence campaign"
      )}
    </button>
  );
}

function Field({
  id,
  label,
  type = "text",
  placeholder,
  hint,
  error,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  error?: string[];
  autoComplete?: string;
}) {
  const errorId = error?.[0] ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="text-[12px] leading-5 text-muted">
          {hint}
        </p>
      ) : null}
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error?.[0] ? true : undefined}
        aria-describedby={describedBy}
        className="ui-input"
      />
      {error?.[0] ? (
        <p id={errorId} className="text-xs font-medium text-danger" role="alert">
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}

function Summary({
  postcode,
  minPrice,
  agentName,
}: {
  postcode: string;
  minPrice: string;
  agentName: string;
}) {
  const price = decimalToNumber(minPrice);

  return (
    <aside className="ui-card h-fit p-5 lg:sticky lg:top-24">
      <h2 className="text-sm font-semibold text-foreground">Campaign summary</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted">Area</dt>
          <dd className="font-medium text-foreground">{postcode || "—"}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted">Minimum price</dt>
          <dd className="font-medium text-foreground">
            {price ? formatEuro(price) : "—"}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted">Agent</dt>
          <dd className="truncate font-medium text-foreground">
            {agentName || "—"}
          </dd>
        </div>
      </dl>
      <h3 className="mt-6 text-sm font-semibold text-foreground">
        Included automatically
      </h3>
      <ul className="mt-3 space-y-2">
        {INCLUDED.map((item) => (
          <li key={item} className="flex gap-2 text-[13px] leading-5 text-muted">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function CreateCampaignForm() {
  const [state, formAction] = useActionState(createCampaign, initialState);
  const [preview, setPreview] = useState({
    postcode: "",
    min_price: "",
    agent_name: "",
  });

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div>
        {state.success && state.campaignId ? (
          <div className="ui-card p-6 sm:p-8" role="status">
            <p className="text-[12px] font-medium text-primary">Campaign launched</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              Property analysis has started.
            </h2>
            <div className="mt-3 flex items-center gap-2">
              <StatusBadge status={state.status ?? "pending"} />
              <span className="text-sm text-muted">
                Progress stays on the campaign page.
              </span>
            </div>
            <ol className="mt-6 space-y-3">
              {LAUNCH_STEPS.map((step, index) => (
                <li key={step} className="flex items-center gap-3 text-sm">
                  {index === 0 ? (
                    <Loader2
                      className="h-4 w-4 shrink-0 animate-spin text-primary"
                      aria-hidden
                    />
                  ) : (
                    <span
                      className="mx-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-border"
                      aria-hidden
                    />
                  )}
                  <span className="text-foreground">{step}</span>
                  <span className="ml-auto text-[12px] text-muted">
                    {index === 0 ? "Starting" : "Waiting"}
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap gap-2">
              <ButtonLink href={`/campaigns/${state.campaignId}`}>
                Open campaign
              </ButtonLink>
              <ButtonLink href="/campaigns" variant="secondary">
                All campaigns
              </ButtonLink>
            </div>
            {state.status === "completed" ? (
              <div className="mt-8 border-t border-border pt-6">
                <CampaignDownloadButton
                  campaignId={state.campaignId}
                  status={state.status}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <form
            action={formAction}
            className="ui-card space-y-8 p-6 sm:p-8"
            onChange={(event) => {
              const data = new FormData(event.currentTarget);
              setPreview({
                postcode: String(data.get("postcode") ?? ""),
                min_price: String(data.get("min_price") ?? ""),
                agent_name: String(data.get("agent_name") ?? ""),
              });
            }}
          >
            <section className="space-y-4">
              <div>
                <p className="text-[12px] font-medium text-primary">01</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  Search area
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="postcode"
                  label="Postcode / department"
                  hint="French postcode, such as 33290, or a department code such as 33."
                  placeholder="33290"
                  autoComplete="postal-code"
                  error={state.fieldErrors?.postcode}
                />
                <Field
                  id="min_price"
                  label="Minimum property price (€)"
                  hint="Only houses sold at or above this amount."
                  type="number"
                  placeholder="250000"
                  error={state.fieldErrors?.min_price}
                />
              </div>
            </section>

            <section className="space-y-4 border-t border-border pt-8">
              <div>
                <p className="text-[12px] font-medium text-primary">02</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  Agent
                </h2>
                <p className="mt-1 text-sm text-muted">
                  This contact is printed on postcards and reports.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="agent_name"
                  label="Name"
                  placeholder="Marie Dupont"
                  autoComplete="name"
                  error={state.fieldErrors?.agent_name}
                />
                <Field
                  id="agent_phone"
                  label="Phone"
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  autoComplete="tel"
                  error={state.fieldErrors?.agent_phone}
                />
                <div className="sm:col-span-2">
                  <Field
                    id="agent_email"
                    label="Email"
                    type="email"
                    placeholder="marie@agency.fr"
                    autoComplete="email"
                    error={state.fieldErrors?.agent_email}
                  />
                </div>
              </div>
            </section>

            {state.error ? (
              <p
                className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger"
                role="alert"
              >
                {state.error}
              </p>
            ) : null}

            <div className="border-t border-border pt-6">
              <SubmitButton />
              <p className="mt-3 text-[12px] leading-5 text-muted">
                Residential houses and plots from 80 m² are included automatically.
              </p>
            </div>
          </form>
        )}
      </div>
      <Summary
        postcode={preview.postcode}
        minPrice={preview.min_price}
        agentName={preview.agent_name}
      />
    </div>
  );
}
