import {
  CircleCheck,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { pipelineStepStates, PIPELINE_STEPS } from "@/lib/campaign-insights";

const STATE_LABELS = {
  done: "Completed",
  active: "Processing",
  pending: "Waiting",
  failed: "Failed",
} as const;

const WORKFLOW = [
  {
    n: "01",
    title: "Data extraction",
    detail: "House sales from the French property register",
  },
  {
    n: "02",
    title: "Property validation",
    detail: "Residential addresses only",
  },
  {
    n: "03",
    title: "Parcel intelligence",
    detail: "Cadastre and plot context",
  },
  {
    n: "04",
    title: "Satellite analysis",
    detail: "Aerial imagery of each site",
  },
  {
    n: "05",
    title: "AI scoring",
    detail: "A, B, and C opportunity grades",
  },
  {
    n: "06",
    title: "Campaign generation",
    detail: "Spreadsheet, postcards, and kit",
  },
];

function StepMark({
  state,
  index,
}: {
  state: "done" | "active" | "pending" | "failed";
  index: number;
}) {
  const tone =
    state === "done"
      ? "border-primary/30 bg-primary-soft text-forest"
      : state === "active"
        ? "border-primary bg-white text-primary"
        : state === "failed"
          ? "border-danger/30 bg-white text-danger"
          : "border-border bg-white text-muted";

  return (
    <span
      className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border ${tone}`}
    >
      {state === "done" ? (
        <CircleCheck className="h-4 w-4" aria-hidden />
      ) : state === "active" ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : state === "failed" ? (
        <TriangleAlert className="h-4 w-4" aria-hidden />
      ) : (
        <span className="text-[11px] font-semibold">{index + 1}</span>
      )}
    </span>
  );
}

export function PipelineSteps({
  status,
  stage,
}: {
  status: string;
  stage?: string | null;
}) {
  const states = pipelineStepStates(status, stage);

  return (
    <div className="relative">
      <div
        className="absolute bottom-4 left-4 top-4 w-px bg-border lg:bottom-auto lg:left-4 lg:right-4 lg:top-4 lg:h-px lg:w-auto"
        aria-hidden
      />
      <ol className="relative grid gap-5 lg:grid-cols-5">
        {PIPELINE_STEPS.map((step, index) => {
          const state = states[index];
          return (
            <li key={step.id} className="flex gap-3 lg:flex-col">
              <StepMark state={state} index={index} />
              <div className="min-w-0 pb-1 lg:pr-3">
                <p className="text-[11px] font-medium text-muted">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {step.label}
                </p>
                <p className="mt-1 text-[13px] leading-5 text-muted">
                  {step.description}
                </p>
                <p
                  className={`mt-2 text-[12px] font-medium ${
                    state === "failed"
                      ? "text-danger"
                      : state === "active" || state === "done"
                        ? "text-primary"
                        : "text-muted"
                  }`}
                >
                  {STATE_LABELS[state]}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function WorkflowOverview() {
  return (
    <section className="ui-card p-6">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        How analysis works
      </h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
        Every campaign follows the same property intelligence sequence. Live
        progress is shown on the campaign itself.
      </p>
      <ol className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
        {WORKFLOW.map((step) => (
          <li key={step.n} className="flex gap-3">
            <span className="mt-0.5 text-[12px] font-semibold text-primary">
              {step.n}
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{step.title}</p>
              <p className="mt-1 text-[13px] leading-5 text-muted">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
