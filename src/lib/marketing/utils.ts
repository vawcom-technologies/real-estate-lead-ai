import { access } from "node:fs/promises";
import PDFDocumentConstructor from "pdfkit";
import type { ParsedAnalysis } from "@/lib/marketing/types";
import { getPropertyImagePath } from "@/lib/satellite-imagery";
import { getAfterImagePath } from "@/lib/storage";

export function sanitizeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function toNumber(
  value: { toString(): string } | number | null | undefined,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatCurrency(
  value: { toString(): string } | number | null | undefined,
): string {
  const amount = toNumber(value);
  if (amount === null) {
    return "N/A";
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | null): string {
  if (!date) {
    return "N/A";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function parseAnalysis(analysis: string | null): ParsedAnalysis {
  if (!analysis) {
    return {};
  }

  try {
    return JSON.parse(analysis) as ParsedAnalysis;
  } catch {
    return { summary: analysis };
  }
}

async function existingPath(imagePath: string): Promise<string | null> {
  try {
    await access(imagePath);
    return imagePath;
  } catch {
    return null;
  }
}

export async function getParcelImagePath(
  parcelNumber: string,
): Promise<string | null> {
  return existingPath(getPropertyImagePath(parcelNumber));
}

export async function getParcelAfterImagePath(
  parcelNumber: string,
): Promise<string | null> {
  return existingPath(getAfterImagePath(parcelNumber));
}

export function gradeColor(grade: string | null): string {
  switch (grade) {
    case "A":
      return "#166534";
    case "B":
      return "#A16207";
    case "C":
      return "#B91C1C";
    default:
      return "#44403C";
  }
}

export function writePdf(
  build: (doc: PDFKit.PDFDocument) => void,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocumentConstructor({ autoFirstPage: false });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    build(doc);
    doc.end();
  });
}

export function writeLabelValue(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
) {
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#57534E")
    .text(label, x, y, { width });

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#1C1917")
    .text(value, x, y + 14, { width });
}
