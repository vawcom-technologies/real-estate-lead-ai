import type { MarketingCampaign, MarketingParcel } from "@/lib/marketing/types";
import {
  formatCurrency,
  getParcelImagePath,
  gradeColor,
  sanitizeFilename,
  writePdf,
} from "@/lib/marketing/utils";

const POSTCARD_WIDTH = 432;
const POSTCARD_HEIGHT = 288;

export function postcardFilename(parcelNumber: string): string {
  return `${sanitizeFilename(parcelNumber)}.pdf`;
}

export async function buildPostcardPdf(
  campaign: MarketingCampaign,
  parcel: MarketingParcel,
): Promise<Buffer> {
  const imagePath = await getParcelImagePath(parcel.parcel_number);
  const grade = parcel.grade ?? "—";
  const address = parcel.address ?? "Homeowner";
  const municipality = parcel.municipality;

  return writePdf((doc) => {
    doc.addPage({ size: [POSTCARD_WIDTH, POSTCARD_HEIGHT], margin: 24 });

    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#1C1917")
      .text("Terrace Opportunity", 24, 24, { width: 220 });

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#57534E")
      .text(`${municipality} · Postcode ${campaign.postcode}`, 24, 48);

    if (imagePath) {
      doc.image(imagePath, 220, 20, {
        fit: [188, 160],
        align: "center",
        valign: "center",
      });
    } else {
      doc
        .rect(220, 20, 188, 160)
        .fillAndStroke("#F5F5F4", "#D6D3D1");
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#78716C")
        .text("Property image unavailable", 232, 88, { width: 160 });
    }

    doc
      .roundedRect(24, 190, 72, 28, 6)
      .fill(gradeColor(parcel.grade));
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#FFFFFF")
      .text(`Grade ${grade}`, 36, 198);

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#44403C")
      .text(parcel.reason ?? "Terrace installation potential identified.", 104, 196, {
        width: 300,
        height: 40,
      });

    doc
      .moveTo(24, 232)
      .lineTo(408, 232)
      .strokeColor("#E7E5E4")
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#1C1917")
      .text(campaign.agent_name, 24, 244);
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#57534E")
      .text(`${campaign.agent_phone} · ${campaign.agent_email}`, 24, 260, {
        width: 250,
      });

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#1C1917")
      .text(address, 250, 244, { width: 158, align: "right" });
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#57534E")
      .text("Recent sale " + formatCurrency(parcel.sale_price), 250, 260, {
        width: 158,
        align: "right",
      });
  });
}
