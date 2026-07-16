"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
      </svg>
    ),
  },
  {
    href: "/campaigns",
    label: "Campaigns",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path
          fillRule="evenodd"
          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    href: "/exports",
    label: "Exports",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path
          fillRule="evenodd"
          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Integrations",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path
          fillRule="evenodd"
          d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

const PIPELINE = [
  { label: "DVF extraction", status: "live" as const },
  { label: "Address validation", status: "live" as const },
  { label: "Satellite imagery", status: "live" as const },
  { label: "A/B/C scoring", status: "live" as const },
  { label: "AI vision", status: "live" as const },
  { label: "Marketing PDFs", status: "live" as const },
  { label: "Before / after AI", status: "soon" as const },
  { label: "Map view", status: "soon" as const },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-sidebar text-white">
      <div className="px-5 py-6">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30 transition-transform group-hover:scale-105">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
              <path
                d="M4 18V9.5L12 4l8 5.5V18a1 1 0 01-1 1h-5v-5H10v5H5a1 1 0 01-1-1z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <p className="font-display text-lg leading-none tracking-tight">
              Terracea
            </p>
            <p className="mt-1 text-[11px] tracking-wide text-white/45">
              Terrace Intelligence
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
          Workspace
        </p>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? "bg-primary text-white shadow-md shadow-primary/25"
                      : "text-white/55 hover:bg-sidebar-hover hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mb-2 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
          Pipeline capability
        </p>
        <ul className="space-y-1 px-1">
          {PIPELINE.map((feature) => (
            <li
              key={feature.label}
              className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs"
            >
              <span className="flex items-center gap-2 text-white/45">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    feature.status === "live" ? "bg-emerald-400" : "bg-accent/80"
                  }`}
                />
                {feature.label}
              </span>
              {feature.status === "soon" ? (
                <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-accent">
                  Soon
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl bg-white/5 px-3 py-3">
          <p className="text-xs font-medium text-white/80">Single-agent workspace</p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/40">
            Auth & multi-user coming in a later phase.
          </p>
        </div>
      </div>
    </aside>
  );
}
