"use client";

import { useState } from "react";

export function ParcelImage({
  parcelNumber,
  alt,
  className = "",
}: {
  parcelNumber: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = `/api/property-images/${encodeURIComponent(parcelNumber)}`;

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-xs text-muted ${className}`}
      >
        No satellite image
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
