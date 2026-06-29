import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { getCampaignExportPath } from "@/lib/campaign-export";
import {
  buildCampaignExcelBuffer,
  campaignExportFilename,
} from "@/lib/excel";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      parcels: {
        orderBy: [{ municipality: "asc" }, { parcel_number: "asc" }],
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const filename = campaignExportFilename(campaign.id);
  let buffer: Buffer;

  try {
    buffer = await readFile(getCampaignExportPath(campaign.id));
  } catch {
    buffer = buildCampaignExcelBuffer(campaign.parcels);
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
