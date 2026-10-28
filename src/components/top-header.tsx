"use client";

import { Menu, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { buttonClasses } from "@/components/ui/button";

const FILTER_KEYS = ["status", "postcode", "agent", "from", "to"] as const;

function shortcutHint() {
  return /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K";
}

function CampaignSearch() {
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  return <SearchField key={query} initialQuery={query} />;
}

function SearchField({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const hint = useSyncExternalStore(
    () => () => {},
    shortcutHint,
    () => "⌘K",
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const next = new URLSearchParams();
    const q = query.trim();
    if (q) next.set("q", q);
    for (const key of FILTER_KEYS) {
      const value = params.get(key);
      if (value) next.set(key, value);
    }
    const search = next.toString();
    router.push(search ? `/campaigns?${search}` : "/campaigns");
  }

  return (
    <form onSubmit={onSearch} className="relative w-full max-w-xl" role="search">
      <label htmlFor="workspace-search" className="sr-only">
        Search campaigns, postcode or properties
      </label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        ref={inputRef}
        id="workspace-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search campaigns, postcode or properties…"
        className="ui-input pl-9 pr-16"
      />
      {hint ? (
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted sm:inline">
          {hint}
        </kbd>
      ) : null}
    </form>
  );
}

export function TopHeader({
  onMenu,
  menuOpen,
}: {
  onMenu: () => void;
  menuOpen: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <button
        type="button"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-white text-foreground lg:hidden"
        aria-label="Open navigation"
        aria-controls="app-sidebar"
        aria-expanded={menuOpen}
        onClick={onMenu}
      >
        <Menu className="h-4 w-4" aria-hidden />
      </button>

      <div className="min-w-0 flex-1">
        <Suspense
          fallback={<div className="h-[42px] w-full rounded-lg bg-surface" />}
        >
          <CampaignSearch />
        </Suspense>
      </div>

      <Link
        href="/campaigns/new"
        className={`${buttonClasses("primary", "md")} shrink-0 px-3`}
      >
        <Plus className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">New campaign</span>
        <span className="sm:hidden">New</span>
      </Link>

      <Link
        href="/settings"
        className="flex shrink-0 items-center gap-2 rounded-lg py-1 pl-1 pr-1 hover:bg-surface sm:pr-2"
        aria-label="Workspace settings"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-forest text-[11px] font-semibold text-white">
          T
        </span>
        <span className="hidden text-left md:block">
          <span className="block text-[13px] font-medium leading-tight text-foreground">
            Terracea
          </span>
          <span className="block text-[11px] leading-tight text-muted">
            Workspace
          </span>
        </span>
      </Link>
    </header>
  );
}
