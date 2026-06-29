import { readFile } from "node:fs/promises";
import { access } from "node:fs/promises";
import { getPropertyImagePath } from "@/lib/satellite-imagery";
import type { Grade } from "@/lib/scoring";

const OPENAI_API_BASE = "https://api.openai.com/v1/chat/completions";

const VISION_PROMPT = `Analyze this backyard from a top-down satellite/aerial image of a residential property in France.

Estimate:
- free backyard area (describe size and approximate usable outdoor space)
- terrain slope (flat, gentle, moderate, or steep)
- vegetation density (sparse, moderate, or heavy)
- terrace installation feasibility (high, moderate, or low — consider access, flat usable space, and obstacles)

Grade the property for terrace prospecting:
- Grade A: large open backyard, few trees, flat terrain, easy access from house
- Grade B: good space, some vegetation, minor obstacles
- Grade C: very little space, heavy vegetation, pool or structures occupying area, steep terrain

Respond with JSON only:
{
  "grade": "A" | "B" | "C",
  "reason": "short summary explaining the grade",
  "free_backyard_area": "estimate",
  "terrain_slope": "estimate",
  "vegetation_density": "estimate",
  "terrace_feasibility": "estimate"
}`;

export type VisionAnalysisResult = {
  grade: Grade;
  reason: string;
  analysis: string;
  estimates: {
    free_backyard_area: string;
    terrain_slope: string;
    vegetation_density: string;
    terrace_feasibility: string;
  };
};

type VisionResponsePayload = {
  grade?: string;
  reason?: string;
  free_backyard_area?: string;
  terrain_slope?: string;
  vegetation_density?: string;
  terrace_feasibility?: string;
};

export function isVisionAnalysisEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getVisionModel(): string {
  return process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini";
}

async function imageExists(parcelId: string): Promise<boolean> {
  try {
    await access(getPropertyImagePath(parcelId));
    return true;
  } catch {
    return false;
  }
}

function parseGrade(value: string | undefined): Grade | null {
  const normalized = value?.trim().toUpperCase();
  if (normalized === "A" || normalized === "B" || normalized === "C") {
    return normalized;
  }
  return null;
}

function parseVisionResponse(content: string): VisionAnalysisResult {
  let payload: VisionResponsePayload;

  try {
    payload = JSON.parse(content) as VisionResponsePayload;
  } catch {
    throw new Error("Vision AI returned invalid JSON");
  }

  const grade = parseGrade(payload.grade);
  if (!grade) {
    throw new Error(`Vision AI returned invalid grade: ${payload.grade ?? "missing"}`);
  }

  const reason = payload.reason?.trim();
  if (!reason) {
    throw new Error("Vision AI returned no reason");
  }

  const estimates = {
    free_backyard_area: payload.free_backyard_area?.trim() || "Unknown",
    terrain_slope: payload.terrain_slope?.trim() || "Unknown",
    vegetation_density: payload.vegetation_density?.trim() || "Unknown",
    terrace_feasibility: payload.terrace_feasibility?.trim() || "Unknown",
  };

  return {
    grade,
    reason,
    estimates,
    analysis: JSON.stringify(
      {
        source: "vision-ai",
        model: getVisionModel(),
        ...estimates,
        summary: reason,
      },
      null,
      2,
    ),
  };
}

export async function analyzePropertyImage(
  parcelId: string,
): Promise<VisionAnalysisResult> {
  if (!isVisionAnalysisEnabled()) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  if (!(await imageExists(parcelId))) {
    throw new Error(`Property image not found for parcel ${parcelId}`);
  }

  const imagePath = getPropertyImagePath(parcelId);
  const imageBuffer = await readFile(imagePath);
  const base64 = imageBuffer.toString("base64");

  const response = await fetch(OPENAI_API_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getVisionModel(),
      response_format: { type: "json_object" },
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: VISION_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Vision AI request failed (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Vision AI returned an empty response");
  }

  return parseVisionResponse(content);
}
