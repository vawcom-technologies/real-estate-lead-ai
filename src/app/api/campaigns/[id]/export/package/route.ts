import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { canDownloadExport } from "@/lib/campaign-status";
import {
  campaignPackageFilename,
  generateMarketingPackage,
  getCampaignPackagePath,
  readCampaignPackage,
} from "@/lib/marketing-export";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (!canDownloadExport(campaign.status)) {
    return NextResponse.json(
      { error: "Marketing package is not ready yet" },
      { status: 409 },
    );
  }

  const filename = campaignPackageFilename(campaign.id);
  let buffer: Buffer;

  try {
    buffer = await readCampaignPackage(campaign.id);
  } catch {
    try {
      await generateMarketingPackage(campaign.id);
      buffer = await readFile(getCampaignPackagePath(campaign.id));
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
