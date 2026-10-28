"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RetryButton({ label = "Try again" }: { label?: string }) {
  const router = useRouter();
  return (
    <Button type="button" onClick={() => router.refresh()}>
      {label}
    </Button>
  );
}
