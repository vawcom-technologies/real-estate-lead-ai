import { RetryButton } from "@/components/ui/retry-button";

export function DataUnavailable() {
  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="ui-card px-6 py-12 text-center sm:px-10">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          We&apos;re temporarily unable to load workspace data.
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Try again in a moment.
        </p>
        <div className="mt-6 flex justify-center">
          <RetryButton />
        </div>
        {process.env.NODE_ENV === "development" ? (
          <details className="mt-8 text-left text-xs leading-5 text-muted">
            <summary className="cursor-pointer font-medium text-foreground">
              Development diagnostics
            </summary>
            <p className="mt-2">
              Confirm the database is running, then reload. Background analysis
              also needs its local services available.
            </p>
          </details>
        ) : null}
      </div>
    </div>
  );
}
