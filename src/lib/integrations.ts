export type IntegrationStatus = {
  id: string;
  name: string;
  description: string;
  envVar: string;
  configured: boolean;
  requiredFor: string[];
  phase: "live" | "planned";
};

function hasEnv(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

export function getIntegrationStatuses(): IntegrationStatus[] {
  return [
    {
      id: "postgres",
      name: "PostgreSQL",
      description: "Campaigns, parcels, grades, and analysis storage.",
      envVar: "DATABASE_URL",
      configured: hasEnv("DATABASE_URL"),
      requiredFor: ["Campaigns", "Parcels", "Exports"],
      phase: "live",
    },
    {
      id: "redis",
      name: "Redis + BullMQ",
      description: "Background job queue for the campaign worker.",
      envVar: "REDIS_URL",
      configured: hasEnv("REDIS_URL"),
      requiredFor: ["Job queue", "Worker"],
      phase: "live",
    },
    {
      id: "google-maps",
      name: "Google Maps",
      description: "Address validation + satellite Static Maps imagery.",
      envVar: "GOOGLE_MAPS_API_KEY",
      configured: hasEnv("GOOGLE_MAPS_API_KEY"),
      requiredFor: ["Address validation", "Satellite imagery"],
      phase: "live",
    },
    {
      id: "openai-vision",
      name: "OpenAI Vision",
      description: "Analyzes satellite images for A/B/C terrace grades.",
      envVar: "OPENAI_API_KEY",
      configured: hasEnv("OPENAI_API_KEY"),
      requiredFor: ["AI scoring", "Reason + analysis"],
      phase: "live",
    },
    {
      id: "openai-images",
      name: "OpenAI Image Generation",
      description: "Before/after terrace visualizations (Phase 3).",
      envVar: "OPENAI_API_KEY",
      configured: hasEnv("OPENAI_API_KEY"),
      requiredFor: ["Before/after renders"],
      phase: "planned",
    },
  ];
}

export function getLiveIntegrationSummary() {
  const statuses = getIntegrationStatuses().filter((s) => s.phase === "live");
  const configured = statuses.filter((s) => s.configured).length;
  return {
    configured,
    total: statuses.length,
    ready: configured === statuses.length,
    statuses,
  };
}
