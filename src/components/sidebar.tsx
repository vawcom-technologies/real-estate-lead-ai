"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Blocks,
  Download,
  FolderKanban,
  House,
  LayoutDashboard,
  X,
} from "lucide-react";
import { useEffect, useRef } from "react";

const SECTIONS = [
  {
    label: "Workspace",
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Prospecting",
    items: [
      { href: "/campaigns", label: "Campaigns", icon: FolderKanban },
      { href: "/exports", label: "Exports", icon: Download },
    ],
  },
  {
    label: "System",
    items: [{ href: "/settings", label: "Integrations", icon: Blocks }],
  },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    closeRef.current?.focus();
  }, [open]);

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          aria-label="Close navigation"
          onClick={onClose}
        />
      ) : null}
      <aside
        id="app-sidebar"
        aria-label="Primary"
        className={`${open ? "flex" : "hidden"} fixed inset-y-0 left-0 z-50 w-60 flex-col bg-ink text-white lg:static lg:flex lg:shrink-0`}
      >
        <div className="flex items-center justify-between px-4 pb-2 pt-5">
          <Link href="/" className="flex min-w-0 items-center gap-2.5" onClick={onClose}>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-forest text-white">
              <House className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-none tracking-tight">
                Terracea
              </span>
              <span className="mt-1 block text-[11px] text-white/45">
                Property intelligence
              </span>
            </span>
          </Link>
          <button
            ref={closeRef}
            type="button"
            className="grid h-8 w-8 place-items-center rounded-md text-white/70 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {SECTIONS.map((section) => (
            <div key={section.label} className="mb-6">
              <p className="mb-1.5 px-2 text-[11px] font-medium text-white/35">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={onClose}
                        className={`relative flex items-center gap-2.5 rounded-md px-2 py-2 text-[13px] font-medium transition-colors ${
                          active
                            ? "bg-white/[0.07] text-white"
                            : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                        }`}
                      >
                        {active ? (
                          <span
                            className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                            aria-hidden
                          />
                        ) : null}
                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-semibold">
              T
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-white">
                Terracea
              </span>
              <span className="block truncate text-[11px] text-white/40">
                Operator workspace
              </span>
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
