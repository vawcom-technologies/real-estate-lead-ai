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
        className={`flex items-center justify-center bg-gray-100 text-xs text-muted ${className}`}
      >
        {variant === "after" ? "No after image" : "No satellite image"}
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
