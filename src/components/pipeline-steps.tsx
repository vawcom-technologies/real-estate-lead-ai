import { pipelineStepStates, PIPELINE_STEPS } from "@/lib/campaign-insights";

const STATE_STYLES = {
  done: "border-emerald-200 bg-emerald-50 text-emerald-800",
  active: "border-primary/30 bg-primary-soft text-primary ring-2 ring-primary/15",
  pending: "border-border bg-surface text-muted",
  failed: "border-red-200 bg-red-50 text-red-700",
};

const STATE_LABELS = {
  done: "Complete",
  active: "In progress",
  pending: "Waiting",
  failed: "Failed",
};

export function PipelineSteps({
  status,
  stage,
}: {
  status: string;
  stage?: string | null;
}) {
  const states = pipelineStepStates(status, stage);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {PIPELINE_STEPS.map((step, index) => {
        const state = states[index];

        return (
          <div
            key={step.id}
            className={`rounded-2xl border px-4 py-4 transition-colors ${STATE_STYLES[state]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold leading-snug">{step.label}</p>
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide opacity-70">
                {STATE_LABELS[state]}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed opacity-90">
              {step.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function PipelineOverview() {
  return (
    <div className="surface-card p-6">
      <h2 className="text-base font-semibold text-foreground">
        Processing pipeline
      </h2>
      <p className="mt-1 text-sm text-muted">
        Every campaign runs through these automated steps on the Redis worker.
      </p>
      <div className="mt-5">
        <PipelineSteps status="completed" />
      </div>
    </div>
  );
}
