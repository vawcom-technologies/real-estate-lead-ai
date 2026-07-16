import { createWriteStream } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ZipArchive } from "archiver";
import { getCampaignExportPath, saveCampaignExcel } from "@/lib/campaign-export";
import { buildCampaignExcelBuffer } from "@/lib/excel";
import { buildPostcardPdf, postcardFilename } from "@/lib/marketing/postcard";
import {
  buildCampaignSummaryPdf,
  buildPropertyReportPdf,
  reportFilename,
} from "@/lib/marketing/report";
import type { MarketingContext } from "@/lib/marketing/types";
import { getParcelImagePath } from "@/lib/marketing/utils";
import { prisma } from "@/lib/prisma";

const EXPORTS_DIR = path.join(process.cwd(), "exports");

export function getCampaignMarketingDir(campaignId: string) {
  return path.join(EXPORTS_DIR, `campaign_${campaignId}_marketing`);
}

export function getCampaignPackagePath(campaignId: string) {
  return path.join(EXPORTS_DIR, `campaign_${campaignId}_marketing.zip`);
}

export function campaignPackageFilename(campaignId: string) {
  return `campaign_${campaignId}_marketing.zip`;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function loadMarketingContext(
  campaignId: string,
): Promise<MarketingContext> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      parcels: {
        orderBy: [{ municipality: "asc" }, { parcel_number: "asc" }],
      },
    },
  });

  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  return {
    campaign,
    parcels: campaign.parcels,
  };
}

async function writeZipDirectory(
  sourceDir: string,
  zipPath: string,
): Promise<void> {
  await mkdir(path.dirname(zipPath), { recursive: true });

  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on("close", () => resolve());
    output.on("error", reject);
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize().catch(reject);
  });
}

export type MarketingPackageResult = {
  campaignId: string;
  parcelCount: number;
  postcards: number;
  reports: number;
  images: number;
  packagePath: string;
};

export async function generateMarketingPackage(
  campaignId: string,
): Promise<MarketingPackageResult> {
  const context = await loadMarketingContext(campaignId);
  const marketingDir = getCampaignMarketingDir(campaignId);
  const postcardsDir = path.join(marketingDir, "postcards");
  const reportsDir = path.join(marketingDir, "reports");
  const imagesDir = path.join(marketingDir, "images");

  await mkdir(postcardsDir, { recursive: true });
  await mkdir(reportsDir, { recursive: true });
  await mkdir(imagesDir, { recursive: true });

  let postcards = 0;
  let reports = 0;
  let images = 0;

  const summaryPdf = await buildCampaignSummaryPdf(
    context.campaign,
    context.parcels,
  );
  await writeFile(path.join(marketingDir, "campaign_summary.pdf"), summaryPdf);

  for (const parcel of context.parcels) {
    const postcardPdf = await buildPostcardPdf(context.campaign, parcel);
    await writeFile(
      path.join(postcardsDir, postcardFilename(parcel.parcel_number)),
      postcardPdf,
    );
    postcards += 1;

    const reportPdf = await buildPropertyReportPdf(context.campaign, parcel);
    await writeFile(
      path.join(reportsDir, reportFilename(parcel.parcel_number)),
      reportPdf,
    );
    reports += 1;

    const imagePath = await getParcelImagePath(parcel.parcel_number);
    if (imagePath) {
      const imageBuffer = await readFile(imagePath);
      await writeFile(
        path.join(imagesDir, `${parcel.parcel_number}.jpg`),
        imageBuffer,
      );
      images += 1;
    }
  }

  let excelBuffer: Buffer;
  if (await fileExists(getCampaignExportPath(campaignId))) {
    excelBuffer = await readFile(getCampaignExportPath(campaignId));
  } else {
    excelBuffer = buildCampaignExcelBuffer(context.parcels);
    await saveCampaignExcel(campaignId, context.parcels);
  }

  await writeFile(
    path.join(marketingDir, `campaign_${campaignId}.xlsx`),
    excelBuffer,
  );

  await writeFile(
    path.join(marketingDir, "README.txt"),
    [
      "Terrace Prospector marketing package",
      "",
      `Campaign: ${campaignId}`,
      `Postcode: ${context.campaign.postcode}`,
      `Parcels: ${context.parcels.length}`,
      "",
      "Contents:",
      "- campaign_{id}.xlsx",
      "- campaign_summary.pdf",
      "- postcards/ (one PDF per parcel)",
      "- reports/ (one PDF per parcel)",
      "- images/ (satellite JPEGs when available)",
    ].join("\n"),
  );

  await writeZipDirectory(marketingDir, getCampaignPackagePath(campaignId));

  return {
    campaignId,
    parcelCount: context.parcels.length,
    postcards,
    reports,
    images,
    packagePath: getCampaignPackagePath(campaignId),
  };
}

export async function readCampaignPackage(campaignId: string): Promise<Buffer> {
  return readFile(getCampaignPackagePath(campaignId));
}
