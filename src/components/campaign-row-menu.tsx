"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { campaignAssets } from "@/lib/campaign-assets";
import { canDownloadExport } from "@/lib/campaign-status";

export function CampaignRowMenu({
  campaignId,
  postcode,
  status,
}: {
  campaignId: string;
  postcode: string;
  status: string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const ready = canDownloadExport(status);
  const assets = campaignAssets(campaignId);
  const excel = assets.find((asset) => asset.id === "excel");
  const kit = assets.find((asset) => asset.id === "package");

  useEffect(() => {
    if (!open) return;

    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    function closeOnScroll() {
      setOpen(false);
    }

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", closeOnScroll, true);
    window.addEventListener("resize", closeOnScroll);
    menuRef.current?.querySelector<HTMLElement>("[role='menuitem']")?.focus();

    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", closeOnScroll, true);
      window.removeEventListener("resize", closeOnScroll);
    };
  }, [open]);

  function toggle() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const width = 220;
      setPosition({
        top: rect.bottom + 6,
        left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
      });
    }
    setOpen((value) => !value);
  }

  const itemClass =
    "block w-full rounded-md px-2.5 py-2 text-left text-sm text-foreground hover:bg-surface";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Actions for ${postcode}`}
        onClick={toggle}
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </button>
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          style={{ top: position.top, left: position.left }}
          className="fixed z-[60] w-[220px] rounded-lg border border-border bg-white p-1 shadow-[0_8px_24px_rgba(12,17,23,0.08)]"
        >
          <Link
            role="menuitem"
            href={`/campaigns/${campaignId}`}
            className={itemClass}
            onClick={() => setOpen(false)}
          >
            View campaign
          </Link>
          {ready && excel ? (
            <a
              role="menuitem"
              href={excel.href}
              download={excel.download}
              className={itemClass}
              onClick={() => setOpen(false)}
            >
              Export Excel
            </a>
          ) : null}
          {ready && kit ? (
            <a
              role="menuitem"
              href={kit.href}
              download={kit.download}
              className={itemClass}
              onClick={() => setOpen(false)}
            >
              Download marketing kit
            </a>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
