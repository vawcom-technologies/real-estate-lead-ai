import { ButtonLink } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="ui-card is-dashed px-6 py-16 text-center">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        {description}
      </p>
      {action ? (
        <div className="mt-6">
          <ButtonLink href={action.href}>{action.label}</ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
