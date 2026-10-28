export function LoadingSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-6xl space-y-6"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading workspace"
    >
      <div className="space-y-3">
        <div className="h-3 w-28 animate-pulse rounded bg-border" />
        <div className="h-8 w-72 max-w-full animate-pulse rounded-md bg-border" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-border/80" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="ui-card h-36 animate-pulse bg-white"
          />
        ))}
      </div>
      <div className="ui-card h-56 animate-pulse" />
    </div>
  );
}
