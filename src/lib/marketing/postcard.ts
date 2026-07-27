import type { MarketingCampaign, MarketingParcel } from "@/lib/marketing/types";
import {
  formatCurrency,
  getParcelAfterImagePath,
  getParcelImagePath,
  gradeColor,
  sanitizeFilename,
  writePdf,
} from "@/lib/marketing/utils";
import {
  estimateValueUplift,
  formatValueUplift,
} from "@/lib/value-uplift";

/** A6 landscape postcard (approx 152 × 102 mm at 72 dpi). */
const POSTCARD_WIDTH = 432;
const POSTCARD_HEIGHT = 288;

export function postcardFilename(parcelNumber: string): string {
  return `${sanitizeFilename(parcelNumber)}.pdf`;
}

function drawImageOrPlaceholder(
  doc: PDFKit.PDFDocument,
  imagePath: string | null,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
) {
  if (imagePath) {
    doc.image(imagePath, x, y, {
      fit: [width, height],
      align: "center",
      valign: "center",
    });
  } else {
    doc.rect(x, y, width, height).fillAndStroke("#F5F5F4", "#D6D3D1");
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#78716C")
      .text(`${label} unavailable`, x + 8, y + height / 2 - 6, {
        width: width - 16,
        align: "center",
      });
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor("#FFFFFF")
    .rect(x, y + height - 18, 52, 18)
    .fill("#1C1917");
  doc.text(label, x + 6, y + height - 13);
}

export async function buildPostcardPdf(
  campaign: MarketingCampaign,
  parcel: MarketingParcel,
): Promise<Buffer> {
  const beforePath = await getParcelImagePath(parcel.parcel_number);
  const afterPath = await getParcelAfterImagePath(parcel.parcel_number);
  const grade = parcel.grade ?? "—";
  const address = parcel.address ?? "Homeowner";
  const municipality = parcel.municipality;
  const uplift = estimateValueUplift(parcel.sale_price);
  const upliftLabel = uplift !== null ? formatValueUplift(uplift) : null;

  return writePdf((doc) => {
    // —— Front: BEFORE | AFTER + value headline ——
    doc.addPage({ size: [POSTCARD_WIDTH, POSTCARD_HEIGHT], margin: 0 });

    doc.rect(0, 0, POSTCARD_WIDTH, POSTCARD_HEIGHT).fill("#FAFAF9");

    const imageY = 16;
    const imageH = 148;
    const gap = 10;
    const sidePad = 16;
    const imageW = (POSTCARD_WIDTH - sidePad * 2 - gap) / 2;

    drawImageOrPlaceholder(
      doc,
      beforePath,
      sidePad,
      imageY,
      imageW,
      imageH,
      "BEFORE",
    );
    drawImageOrPlaceholder(
      doc,
      afterPath,
      sidePad + imageW + gap,
      imageY,
      imageW,
      imageH,
      "AFTER",
    );

    const headlineY = 176;
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#1C1917")
      .text("PROFITEZ DE VOTRE JARDIN ET", sidePad, headlineY, {
        width: POSTCARD_WIDTH - sidePad * 2,
        align: "center",
      });
    doc.text("AUGMENTEZ LA VALEUR DE", sidePad, headlineY + 16, {
      width: POSTCARD_WIDTH - sidePad * 2,
      align: "center",
    });
    doc
      .fillColor("#166534")
      .text(
        upliftLabel
          ? `VOTRE BIEN DE ${upliftLabel}`
          : "VOTRE BIEN AVEC UNE TERRASSE",
        sidePad,
        headlineY + 32,
        {
          width: POSTCARD_WIDTH - sidePad * 2,
          align: "center",
        },
      );

    doc
      .roundedRect(sidePad, 248, 56, 22, 4)
      .fill(gradeColor(parcel.grade));
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#FFFFFF")
      .text(`Grade ${grade}`, sidePad + 8, 254);

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#57534E")
      .text(
        parcel.reason ?? "Potentiel terrasse identifié sur cette propriété.",
        sidePad + 64,
        250,
        { width: POSTCARD_WIDTH - sidePad * 2 - 64, height: 28 },
      );

    // —— Back: agent contact ——
    doc.addPage({ size: [POSTCARD_WIDTH, POSTCARD_HEIGHT], margin: 0 });
    doc.rect(0, 0, POSTCARD_WIDTH, POSTCARD_HEIGHT).fill("#FAFAF9");

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#1C1917")
      .text("Votre projet terrasse", 36, 48, { width: 220 });

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#57534E")
      .text(
        "Une terrasse bien conçue valorise votre bien et transforme votre jardin en véritable espace de vie.",
        36,
        76,
        { width: 220 },
      );

    doc
      .moveTo(36, 130)
      .lineTo(256, 130)
      .strokeColor("#E7E5E4")
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#1C1917")
      .text(campaign.agent_name, 36, 148);

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#44403C")
      .text(campaign.agent_phone, 36, 172)
      .text(campaign.agent_email, 36, 190);

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#78716C")
      .text(`${municipality} · ${campaign.postcode}`, 36, 220)
      .text(address, 36, 236, { width: 220 })
      .text(`Vente récente ${formatCurrency(parcel.sale_price)}`, 36, 252);

    // Stamp / address panel placeholder (right side)
    doc.roundedRect(280, 40, 120, 80, 6).strokeColor("#D6D3D1").stroke();
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#A8A29E")
      .text("AFFRANCHIR", 300, 74, { width: 80, align: "center" });

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#A8A29E")
      .text("Terrasse Prospector", 280, 250, {
        width: 120,
        align: "right",
      });
  });
}
