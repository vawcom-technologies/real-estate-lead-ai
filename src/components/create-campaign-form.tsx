"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  createCampaign,
  type CreateCampaignState,
} from "@/app/actions/campaign";
import { CampaignDownloadButton } from "@/components/campaign-download-button";
import { StatusBadge } from "@/components/status-badge";

const initialState: CreateCampaignState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Creating campaign…" : "Launch campaign"}
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
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  error?: string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
      </label>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
      />
      {error?.[0] ? (
        <p className="text-xs font-medium text-danger">{error[0]}</p>
      ) : null}
    </div>
  );
}

export function CreateCampaignForm() {
  const [state, formAction] = useActionState(createCampaign, initialState);

  if (state.success && state.campaignId) {
    return (
      <div className="surface-card p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Campaign launched
        </p>
        <h2 className="font-display mt-2 text-2xl text-foreground">
          Job queued in Redis
        </h2>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm font-medium text-muted">Current status</span>
          <StatusBadge status={state.status ?? "pending"} />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          The worker will extract DVF sales, validate addresses (BAN / OSM /
          Google), fetch satellite images, score parcels A/B/C, optionally run
          OpenAI vision, then build Excel + marketing ZIP exports.
        </p>

        <ol className="mt-6 space-y-2 rounded-2xl bg-surface px-4 py-4 text-sm text-muted">
          {[
            "Extract house sales from DVF",
            "Qualify residential addresses only",
            "Retrieve satellite imagery",
            "Rule scoring + AI vision",
            "Generate Excel & marketing package",
          ].map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="font-semibold text-primary">{index + 1}.</span>
              {step}
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/campaigns/${state.campaignId}`}
            className="inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Open campaign details
          </Link>
          <Link
            href="/campaigns"
            className="inline-flex rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface"
          >
            Back to campaign list
          </Link>
        </div>

        {state.status === "completed" ? (
          <div className="mt-8 border-t border-border pt-8">
            <CampaignDownloadButton
              campaignId={state.campaignId}
              status={state.status ?? "pending"}
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="surface-card p-8">
      <div className="mb-8">
        <h2 className="font-display text-2xl text-foreground">Campaign setup</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Define the search area and agent contact used on postcards and reports.
          Plot size filter is fixed at ≥ 80 m² for houses.
        </p>
      </div>

      <form action={formAction} className="grid gap-6 sm:grid-cols-2">
        <Field
          id="postcode"
          label="Department / postcode"
          hint="French postcode (e.g. 33290) or department code (e.g. 33)"
          placeholder="33290"
          error={state.fieldErrors?.postcode}
        />
        <Field
          id="min_price"
          label="Minimum sale price (€)"
          hint="Only include houses sold at or above this amount"
          type="number"
          placeholder="250000"
          error={state.fieldErrors?.min_price}
        />
        <Field
          id="agent_name"
          label="Agent name"
          placeholder="Marie Dupont"
          error={state.fieldErrors?.agent_name}
        />
        <Field
          id="agent_phone"
          label="Agent phone"
          type="tel"
          placeholder="+33 6 12 34 56 78"
          error={state.fieldErrors?.agent_phone}
        />
        <div className="sm:col-span-2">
          <Field
            id="agent_email"
            label="Agent email"
            type="email"
            placeholder="marie@agency.fr"
            error={state.fieldErrors?.agent_email}
          />
        </div>

        {state.error ? (
          <p className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}

        <div className="sm:col-span-2">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
