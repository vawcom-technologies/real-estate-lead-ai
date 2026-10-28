"use client";

import { useSyncExternalStore } from "react";

function greetingNow() {
  const hour = new Date().getHours();
  const hello =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${hello} — here's your prospecting overview.`;
}

export function DashboardGreeting() {
  const greeting = useSyncExternalStore(
    () => () => {},
    greetingNow,
    () => "Here's your prospecting overview.",
  );

  return <>{greeting}</>;
}
