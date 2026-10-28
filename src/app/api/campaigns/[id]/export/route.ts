import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { getWorkspaceCampaign } from "@/lib/demo-workspace";
import { buildCampaignExcelBuffer } from "@/lib/excel";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const EXCEL_HEADERS = {
  "Content-Type":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "Content-Disposition": `attachment; filename="parcels.xlsx"`,
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const demo = getWorkspaceCampaign(id);

  if (demo) {
    const buffer = buildCampaignExcelBuffer(demo.parcels);
    return new NextResponse(new Uint8Array(buffer), { headers: EXCEL_HEADERS });
  }

  const { prisma } = await import("@/lib/prisma");
  const { getCampaignExportPath } = await import("@/lib/campaign-export");

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

  let buffer: Buffer;

  try {
    buffer = await readFile(getCampaignExportPath(campaign.id));
  } catch {
    buffer = buildCampaignExcelBuffer(campaign.parcels);
  }

  return new NextResponse(new Uint8Array(buffer), { headers: EXCEL_HEADERS });
}
