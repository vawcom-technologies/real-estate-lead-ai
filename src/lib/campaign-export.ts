import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildCampaignExcelBuffer,
  campaignExportFilename,
  type ParcelExportRow,
} from "@/lib/excel";

const EXPORTS_DIR = path.join(process.cwd(), "exports");

export function getCampaignExportPath(campaignId: string) {
  return path.join(EXPORTS_DIR, campaignExportFilename(campaignId));
}

export async function saveCampaignExcel(
  campaignId: string,
  parcels: ParcelExportRow[],
) {
  await mkdir(EXPORTS_DIR, { recursive: true });
  const buffer = buildCampaignExcelBuffer(parcels);
  await writeFile(getCampaignExportPath(campaignId), buffer);
}

export async function readCampaignExcel(campaignId: string) {
  return readFile(getCampaignExportPath(campaignId));
}
