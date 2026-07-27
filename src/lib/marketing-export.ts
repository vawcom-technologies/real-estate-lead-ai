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
import {
  getParcelAfterImagePath,
  getParcelImagePath,
} from "@/lib/marketing/utils";
import { prisma } from "@/lib/prisma";

const EXPORTS_DIR = path.join(process.cwd(), "exports");

export function getCampaignMarketingDir(campaignId: string) {
  return path.join(EXPORTS_DIR, `campaign_${campaignId}_marketing`);
}

export function getCampaignPackagePath(campaignId: string) {
  return path.join(EXPORTS_DIR, `campaign_${campaignId}_marketing.zip`);
}

export function getBeforeImagesZipPath(campaignId: string) {
  return path.join(EXPORTS_DIR, `campaign_${campaignId}_before_images.zip`);
}

export function getAfterImagesZipPath(campaignId: string) {
  return path.join(EXPORTS_DIR, `campaign_${campaignId}_after_images.zip`);
}

export function getPostcardsZipPath(campaignId: string) {
  return path.join(EXPORTS_DIR, `campaign_${campaignId}_postcards.zip`);
}

export function campaignPackageFilename(campaignId: string) {
  return `campaign_${campaignId}_marketing.zip`;
}

export function beforeImagesZipFilename(campaignId: string) {
  return `campaign_${campaignId}_before_images.zip`;
}

export function afterImagesZipFilename(campaignId: string) {
  return `campaign_${campaignId}_after_images.zip`;
}

export function postcardsZipFilename(campaignId: string) {
  return `campaign_${campaignId}_postcards.zip`;
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

async function writeZipFromDirectory(
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

async function writeZipFromFiles(
  files: Array<{ name: string; buffer: Buffer }>,
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
    for (const file of files) {
      archive.append(file.buffer, { name: file.name });
    }
    archive.finalize().catch(reject);
  });
}

export type MarketingPackageResult = {
  campaignId: string;
  parcelCount: number;
  postcards: number;
  reports: number;
  beforeImages: number;
  afterImages: number;
  packagePath: string;
  beforeImagesZip: string;
  afterImagesZip: string;
  postcardsZip: string;
};

export async function generateMarketingPackage(
  campaignId: string,
): Promise<MarketingPackageResult> {
  const context = await loadMarketingContext(campaignId);
  const marketingDir = getCampaignMarketingDir(campaignId);
  const postcardsDir = path.join(marketingDir, "postcards");
  const reportsDir = path.join(marketingDir, "reports");
  const beforeDir = path.join(marketingDir, "before");
  const afterDir = path.join(marketingDir, "after");

  await mkdir(postcardsDir, { recursive: true });
  await mkdir(reportsDir, { recursive: true });
  await mkdir(beforeDir, { recursive: true });
  await mkdir(afterDir, { recursive: true });

  let postcards = 0;
  let reports = 0;
  let beforeImages = 0;
  let afterImages = 0;

  const postcardBuffers: Array<{ name: string; buffer: Buffer }> = [];
  const beforeBuffers: Array<{ name: string; buffer: Buffer }> = [];
  const afterBuffers: Array<{ name: string; buffer: Buffer }> = [];

  const summaryPdf = await buildCampaignSummaryPdf(
    context.campaign,
    context.parcels,
  );
  await writeFile(path.join(marketingDir, "campaign_summary.pdf"), summaryPdf);

  for (const parcel of context.parcels) {
    const postcardPdf = await buildPostcardPdf(context.campaign, parcel);
    const postcardName = postcardFilename(parcel.parcel_number);
    await writeFile(path.join(postcardsDir, postcardName), postcardPdf);
    postcardBuffers.push({ name: postcardName, buffer: postcardPdf });
    postcards += 1;

    const reportPdf = await buildPropertyReportPdf(context.campaign, parcel);
    await writeFile(
      path.join(reportsDir, reportFilename(parcel.parcel_number)),
      reportPdf,
    );
    reports += 1;

    const beforePath = await getParcelImagePath(parcel.parcel_number);
    if (beforePath) {
      const imageBuffer = await readFile(beforePath);
      const name = `${parcel.parcel_number}.jpg`;
      await writeFile(path.join(beforeDir, name), imageBuffer);
      beforeBuffers.push({ name, buffer: imageBuffer });
      beforeImages += 1;
    }

    const afterPath = await getParcelAfterImagePath(parcel.parcel_number);
    if (afterPath) {
      const imageBuffer = await readFile(afterPath);
      const name = `${parcel.parcel_number}_after.jpg`;
      await writeFile(path.join(afterDir, name), imageBuffer);
      afterBuffers.push({ name, buffer: imageBuffer });
      afterImages += 1;
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
    path.join(marketingDir, "parcels.xlsx"),
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
      "- parcels.xlsx",
      "- campaign_summary.pdf",
      "- postcards/  (BEFORE|AFTER PDF per parcel)",
      "- reports/  (property report PDF per parcel)",
      "- before/  (satellite JPEGs)",
      "- after/  (AI terrace visualizations when available)",
      "",
      "Also available as separate downloads:",
      "- parcels.xlsx",
      "- before_images.zip",
      "- after_images.zip",
      "- postcards.zip",
    ].join("\n"),
  );

  const packagePath = getCampaignPackagePath(campaignId);
  const beforeImagesZip = getBeforeImagesZipPath(campaignId);
  const afterImagesZip = getAfterImagesZipPath(campaignId);
  const postcardsZip = getPostcardsZipPath(campaignId);

  await writeZipFromDirectory(marketingDir, packagePath);
  await writeZipFromFiles(beforeBuffers, beforeImagesZip);
  await writeZipFromFiles(afterBuffers, afterImagesZip);
  await writeZipFromFiles(postcardBuffers, postcardsZip);

  return {
    campaignId,
    parcelCount: context.parcels.length,
    postcards,
    reports,
    beforeImages,
    afterImages,
    packagePath,
    beforeImagesZip,
    afterImagesZip,
    postcardsZip,
  };
}

export async function readCampaignPackage(campaignId: string): Promise<Buffer> {
  return readFile(getCampaignPackagePath(campaignId));
}

export async function readBeforeImagesZip(campaignId: string): Promise<Buffer> {
  return readFile(getBeforeImagesZipPath(campaignId));
}

export async function readAfterImagesZip(campaignId: string): Promise<Buffer> {
  return readFile(getAfterImagesZipPath(campaignId));
}

export async function readPostcardsZip(campaignId: string): Promise<Buffer> {
  return readFile(getPostcardsZipPath(campaignId));
}
