"use client";

import { useState } from "react";

export function ParcelImage({
  parcelNumber,
  alt,
  className = "",
  variant = "before",
}: {
  parcelNumber: string;
  alt: string;
  className?: string;
  variant?: "before" | "after";
}) {
  const [failed, setFailed] = useState(false);
  const query = variant === "after" ? "?variant=after" : "";
  const src = `/api/property-images/${encodeURIComponent(parcelNumber)}${query}`;

  if (failed) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-surface px-4 text-center text-xs text-muted ${className}`}
      >
        {variant === "after" ? "Visualization not ready" : "Imagery not ready"}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`h-full w-full object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
