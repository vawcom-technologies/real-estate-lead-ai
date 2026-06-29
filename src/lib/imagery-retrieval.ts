import { getParcelGeometry } from "@/lib/parcel-geometry";
import { prisma } from "@/lib/prisma";
import {
  fetchTopDownImage,
  getPropertyImagePath,
  savePropertyImage,
} from "@/lib/satellite-imagery";
import { access } from "node:fs/promises";

export type ImageryRetrievalResult = {
  campaignId: string;
  retrieved: number;
  skipped: number;
  failed: number;
};

async function imageExists(parcelId: string): Promise<boolean> {
  try {
    await access(getPropertyImagePath(parcelId));
    return true;
  } catch {
    return false;
  }
}

export async function retrieveParcelImage(parcelId: string): Promise<{
  path: string;
  source: string;
  cached: boolean;
}> {
  const imagePath = getPropertyImagePath(parcelId);

  if (await imageExists(parcelId)) {
    return { path: imagePath, source: "cached", cached: true };
  }

  const { bbox } = await getParcelGeometry(parcelId);
  const { buffer, source } = await fetchTopDownImage(bbox);
  const path = await savePropertyImage(parcelId, buffer);

  return { path, source, cached: false };
}

export async function runImageryRetrieval(
  campaignId: string,
): Promise<ImageryRetrievalResult> {
  const parcels = await prisma.parcel.findMany({
    where: { campaign_id: campaignId },
    select: { parcel_number: true },
  });

  let retrieved = 0;
  let skipped = 0;
  let failed = 0;

  for (const parcel of parcels) {
    try {
      const result = await retrieveParcelImage(parcel.parcel_number);
      if (result.cached) {
        skipped += 1;
      } else {
        retrieved += 1;
      }
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `Imagery retrieval failed for ${parcel.parcel_number}: ${message}`,
      );
    }
  }

  return {
    campaignId,
    retrieved,
    skipped,
    failed,
  };
}
