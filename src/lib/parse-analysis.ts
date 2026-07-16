export type ParsedAnalysis = {
  free_backyard_area?: string;
  terrain_slope?: string;
  vegetation_density?: string;
  terrace_feasibility?: string;
  summary?: string;
  source?: string;
  model?: string;
};

export function parseAnalysis(analysis: string | null): ParsedAnalysis {
  if (!analysis) {
    return {};
  }

  try {
    return JSON.parse(analysis) as ParsedAnalysis;
  } catch {
    return { summary: analysis };
  }
}
