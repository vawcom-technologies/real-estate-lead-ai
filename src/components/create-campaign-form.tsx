"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createCampaign,
  type CreateCampaignState,
} from "@/app/actions/campaign";
import { CampaignDownloadButton } from "@/components/campaign-download-button";
import { formatCampaignStatus } from "@/lib/campaign-status";

const initialState: CreateCampaignState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 w-full rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Starting…" : "Start Campaign"}
    </button>
  );
}

function Field({
  id,
  label,
  type = "text",
  placeholder,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  error?: string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-stone-700">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5"
      />
      {error?.[0] ? (
        <p className="text-xs text-red-600">{error[0]}</p>
      ) : null}
    </div>
  );
}

export function CreateCampaignForm() {
  const [state, formAction] = useActionState(createCampaign, initialState);

  if (state.success && state.campaignId) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
            Campaign created
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-stone-900">
            Your campaign has been queued
          </h2>
          <p className="text-sm text-stone-600">
            Status:{" "}
            <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-xs font-medium text-stone-700">
              {formatCampaignStatus(state.status ?? "pending")}
            </span>
          </p>
          <p className="text-xs text-stone-500">
            Processing runs in the background. Refresh this page to check progress.
          </p>
          <p className="text-xs text-stone-500">
            File: campaign_{state.campaignId}.xlsx
          </p>
        </div>
        <div className="mt-6">
          <CampaignDownloadButton
            campaignId={state.campaignId}
            status={state.status ?? "pending"}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-8">
      <div className="mb-8">
        <h2 className="text-lg font-semibold tracking-tight text-stone-900">
          Create Campaign
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Enter the search area and agent details to begin prospecting.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        <Field
          id="postcode"
          label="Postcode"
          placeholder="e.g. 75001"
          error={state.fieldErrors?.postcode}
        />
        <Field
          id="min_price"
          label="Minimum Price"
          type="number"
          placeholder="e.g. 250000"
          error={state.fieldErrors?.min_price}
        />
        <Field
          id="agent_name"
          label="Agent Name"
          placeholder="e.g. Marie Dupont"
          error={state.fieldErrors?.agent_name}
        />
        <Field
          id="agent_phone"
          label="Phone"
          type="tel"
          placeholder="e.g. +33 6 12 34 56 78"
          error={state.fieldErrors?.agent_phone}
        />
        <Field
          id="agent_email"
          label="Email"
          type="email"
          placeholder="e.g. marie@agency.fr"
          error={state.fieldErrors?.agent_email}
        />

        {state.error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}

        <SubmitButton />
      </form>
    </div>
  );
}
