"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function TopHeader() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (!q) {
      router.push("/campaigns");
      return;
    }
    router.push(`/campaigns?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="flex h-16 items-center justify-between gap-6 border-b border-border/80 bg-card/80 px-8 backdrop-blur-md">
      <form onSubmit={onSearch} className="relative max-w-md flex-1">
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        >
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search postcode or agent…"
          className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
        />
      </form>

      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="hidden rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface sm:inline-flex"
        >
          API keys
        </Link>
        <Link
          href="/campaigns/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary-hover"
        >
          Launch campaign
        </Link>
      </div>
    </header>
  );
}
