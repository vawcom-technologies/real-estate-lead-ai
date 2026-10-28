import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-lg py-16 text-center">
      <p className="text-[12px] font-medium tracking-wide text-primary">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        This page is not in the workspace.
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        The campaign may have been removed, or the address is incorrect.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <ButtonLink href="/">Dashboard</ButtonLink>
        <ButtonLink href="/campaigns" variant="secondary">
          Campaigns
        </ButtonLink>
      </div>
    </div>
  );
}
