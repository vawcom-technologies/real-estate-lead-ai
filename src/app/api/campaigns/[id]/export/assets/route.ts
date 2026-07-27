import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { canDownloadExport } from "@/lib/campaign-status";
import {
  generateMarketingPackage,
  getAfterImagesZipPath,
  getBeforeImagesZipPath,
  getPostcardsZipPath,
  readAfterImagesZip,
  readBeforeImagesZip,
  readPostcardsZip,
} from "@/lib/marketing-export";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type AssetKind = "before" | "after" | "postcards";

async function serveZip(
  campaignId: string,
  kind: AssetKind,
): Promise<NextResponse> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, status: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (!canDownloadExport(campaign.status)) {
    return NextResponse.json(
      { error: "Export is not ready yet" },
      { status: 409 },
    );
  }

  const readers = {
    before: {
      read: readBeforeImagesZip,
      filename: () => "before_images.zip",
      path: getBeforeImagesZipPath,
    },
    after: {
      read: readAfterImagesZip,
      filename: () => "after_images.zip",
      path: getAfterImagesZipPath,
    },
    postcards: {
      read: readPostcardsZip,
      filename: () => "postcards.zip",
      path: getPostcardsZipPath,
    },
  } as const;

  const asset = readers[kind];
  const filename = asset.filename();
  let buffer: Buffer;

  try {
    buffer = await asset.read(campaign.id);
  } catch {
    try {
      await generateMarketingPackage(campaign.id);
      buffer = await readFile(asset.path(campaign.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  const kind = new URL(request.url).searchParams.get("kind") as AssetKind | null;

  if (kind !== "before" && kind !== "after" && kind !== "postcards") {
    return NextResponse.json(
      { error: "Query ?kind=before|after|postcards is required" },
      { status: 400 },
    );
  }

  return serveZip(id, kind);
}
