import { readFile } from "node:fs/promises";
import { access } from "node:fs/promises";
import {
  detectPropertyImageMimeType,
  getPropertyImagePath,
} from "@/lib/satellite-imagery";
import { getAfterImagePath, storeAfterImage } from "@/lib/storage";

const OPENAI_IMAGES_EDITS = "https://api.openai.com/v1/images/edits";

const TERRACE_EDIT_PROMPT = `Add a realistic 20m² wooden terrace to this residential property aerial/satellite photo.

Place the terrace adjacent to the house in the clearest backyard area.

Keep existing features unchanged:
- pool
- shed
- sculpture
- trees and vegetation outside the terrace footprint
- roof, driveway, and neighboring properties

Add on the terrace:
- pergola
- outdoor furniture
- soft lighting
- planters

Photorealistic aerial view. Match the existing lighting, shadows, resolution, and perspective. Do not add text, watermarks, or labels.`;

export type AfterImageResult = {
  parcelId: string;
  beforePath: string;
  afterPath: string;
  remoteUrl: string | null;
  model: string;
};

export function isImageGenerationEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getImageGenerationModel(): string {
  return process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1";
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function generateAfterImage(
  parcelId: string,
): Promise<AfterImageResult> {
  if (!isImageGenerationEnabled()) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const beforePath = getPropertyImagePath(parcelId);
  if (!(await fileExists(beforePath))) {
    throw new Error(`Before image not found for parcel ${parcelId}`);
  }

  const afterPath = getAfterImagePath(parcelId);
  if (await fileExists(afterPath)) {
    return {
      parcelId,
      beforePath,
      afterPath,
      remoteUrl: null,
      model: "cached",
    };
  }

  const beforeBuffer = await readFile(beforePath);
  const mimeType = detectPropertyImageMimeType(beforeBuffer);
  const model = getImageGenerationModel();

  const form = new FormData();
  form.append("model", model);
  form.append(
    "image",
    new Blob([new Uint8Array(beforeBuffer)], { type: mimeType }),
    `${parcelId}.jpg`,
  );
  form.append("prompt", TERRACE_EDIT_PROMPT);
  form.append("n", "1");
  // gpt-image-1 supports 1024x1024; keep square to match satellite crops
  form.append("size", "1024x1024");

  const response = await fetch(OPENAI_IMAGES_EDITS, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: form,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Image generation failed (${response.status}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };

  const item = data.data?.[0];
  let afterBuffer: Buffer;

  if (item?.b64_json) {
    afterBuffer = Buffer.from(item.b64_json, "base64");
  } else if (item?.url) {
    const imageResponse = await fetch(item.url);
    if (!imageResponse.ok) {
      throw new Error(
        `Failed to download generated image (${imageResponse.status})`,
      );
    }
    afterBuffer = Buffer.from(await imageResponse.arrayBuffer());
  } else {
    throw new Error("Image generation returned no image data");
  }

  const stored = await storeAfterImage(parcelId, afterBuffer);

  return {
    parcelId,
    beforePath,
    afterPath: stored.localPath,
    remoteUrl: stored.remoteUrl,
    model,
  };
}
