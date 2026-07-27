import * as XLSX from "xlsx";

export type ParcelExportRow = {
  department: string;
  municipality: string;
  section: string;
  parcel_number: string;
  sale_price: { toString(): string } | number | null;
  sale_date: Date | null;
  address: string | null;
  house_area: { toString(): string } | number | null;
  plot_area: { toString(): string } | number | null;
  grade: string | null;
  reason: string | null;
  analysis: string | null;
};

const COLUMNS = [
  "Department",
  "Municipality",
  "Section",
  "Parcel",
  "Sale Price",
  "Sale Date",
  "Address",
  "House Area",
  "Plot Area",
  "Grade",
  "Reason",
  "Analysis",
] as const;

function toNumber(
  value: { toString(): string } | number | null | undefined,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : null;
}

function formatSaleDate(date: Date | null): string {
  if (!date) {
    return "";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function parcelToRow(parcel: ParcelExportRow): Record<(typeof COLUMNS)[number], string | number> {
  return {
    Department: parcel.department,
    Municipality: parcel.municipality,
    Section: parcel.section,
    Parcel: parcel.parcel_number,
    "Sale Price": toNumber(parcel.sale_price) ?? "",
    "Sale Date": formatSaleDate(parcel.sale_date),
    Address: parcel.address ?? "",
    "House Area": toNumber(parcel.house_area) ?? "",
    "Plot Area": toNumber(parcel.plot_area) ?? "",
    Grade: parcel.grade ?? "",
    Reason: parcel.reason ?? "",
    Analysis: parcel.analysis ?? "",
  };
}

export function buildCampaignWorkbook(parcels: ParcelExportRow[]): XLSX.WorkBook {
  const rows = parcels.map(parcelToRow);
  const worksheet =
    rows.length > 0
      ? XLSX.utils.json_to_sheet(rows, { header: [...COLUMNS] })
      : XLSX.utils.aoa_to_sheet([[...COLUMNS]]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Parcels");
  return workbook;
}

export function buildCampaignExcelBuffer(parcels: ParcelExportRow[]): Buffer {
  const workbook = buildCampaignWorkbook(parcels);
  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  );
}

export function campaignExportFilename(campaignId: string): string {
  return `parcels_${campaignId}.xlsx`;
}
