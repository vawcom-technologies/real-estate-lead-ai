import type { MarketingCampaign, MarketingParcel } from "@/lib/marketing/types";
import {
  formatCurrency,
  formatDate,
  getParcelImagePath,
  gradeColor,
  parseAnalysis,
  sanitizeFilename,
  toNumber,
  writeLabelValue,
  writePdf,
} from "@/lib/marketing/utils";

export function reportFilename(parcelNumber: string): string {
  return `${sanitizeFilename(parcelNumber)}.pdf`;
}

export async function buildPropertyReportPdf(
  campaign: MarketingCampaign,
  parcel: MarketingParcel,
): Promise<Buffer> {
  const imagePath = await getParcelImagePath(parcel.parcel_number);
  const analysis = parseAnalysis(parcel.analysis);
  const plotArea = toNumber(parcel.plot_area);
  const houseArea = toNumber(parcel.house_area);
  const backyard =
    plotArea !== null && houseArea !== null
      ? Math.max(0, plotArea - houseArea)
      : null;

  return writePdf((doc) => {
    doc.addPage({ size: "A4", margin: 48 });

    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("#1C1917")
      .text("Terrace Prospector Report", 48, 48);

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#57534E")
      .text(
        `Campaign ${campaign.postcode} · Prepared for ${campaign.agent_name}`,
        48,
        78,
      );

    doc
      .roundedRect(48, 108, 56, 28, 6)
      .fill(gradeColor(parcel.grade));
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#FFFFFF")
      .text(`Grade ${parcel.grade ?? "—"}`, 58, 116);

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#1C1917")
      .text(parcel.address ?? "Address unavailable", 116, 110, { width: 380 });
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#57534E")
      .text(
        `${parcel.municipality}, ${parcel.department} · Parcel ${parcel.parcel_number}`,
        116,
        132,
      );

    let y = 170;
    writeLabelValue(doc, "Sale price", formatCurrency(parcel.sale_price), 48, y, 150);
    writeLabelValue(doc, "Sale date", formatDate(parcel.sale_date), 220, y, 150);
    writeLabelValue(doc, "Plot area", plotArea ? `${plotArea} m²` : "N/A", 392, y, 120);

    y += 48;
    writeLabelValue(
      doc,
      "House area",
      houseArea ? `${houseArea} m²` : "N/A",
      48,
      y,
      150,
    );
    writeLabelValue(
      doc,
      "Estimated backyard",
      backyard !== null ? `${Math.round(backyard)} m²` : "N/A",
      220,
      y,
      150,
    );
    writeLabelValue(doc, "Section", parcel.section, 392, y, 120);

    y += 56;
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#1C1917")
      .text("Assessment", 48, y);
    y += 22;
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#292524")
      .text(parcel.reason ?? "No assessment reason recorded.", 48, y, {
        width: 500,
      });

    y += 48;
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#1C1917")
      .text("Site analysis", 48, y);
    y += 22;

    const analysisRows = [
      ["Free backyard area", analysis.free_backyard_area],
      ["Terrain slope", analysis.terrain_slope],
      ["Vegetation density", analysis.vegetation_density],
      ["Terrace feasibility", analysis.terrace_feasibility],
    ].filter(([, value]) => Boolean(value));

    if (analysisRows.length === 0) {
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#57534E")
        .text("No detailed analysis available.", 48, y);
      y += 24;
    } else {
      for (const [label, value] of analysisRows) {
        writeLabelValue(doc, label!, value!, 48, y, 220);
        y += 42;
      }
    }

    if (imagePath) {
      y += 8;
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#1C1917")
        .text("Satellite view", 48, y);
      doc.image(imagePath, 48, y + 24, {
        fit: [500, 220],
        align: "center",
        valign: "center",
      });
    }

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#78716C")
      .text(
        `Contact: ${campaign.agent_name} · ${campaign.agent_phone} · ${campaign.agent_email}`,
        48,
        780,
        { width: 500, align: "center" },
      );
  });
}

export async function buildCampaignSummaryPdf(
  campaign: MarketingCampaign,
  parcels: MarketingParcel[],
): Promise<Buffer> {
  const gradeCounts = parcels.reduce(
    (counts, parcel) => {
      const grade = parcel.grade ?? "Ungraded";
      counts[grade] = (counts[grade] ?? 0) + 1;
      return counts;
    },
    {} as Record<string, number>,
  );

  return writePdf((doc) => {
    doc.addPage({ size: "A4", margin: 48 });

    doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .fillColor("#1C1917")
      .text("Campaign Marketing Summary", 48, 48);

    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#57534E")
      .text(`Postcode ${campaign.postcode} · ${parcels.length} qualified parcels`, 48, 82);

    let y = 120;
    writeLabelValue(doc, "Agent", campaign.agent_name, 48, y, 220);
    writeLabelValue(doc, "Phone", campaign.agent_phone, 300, y, 220);
    y += 48;
    writeLabelValue(doc, "Email", campaign.agent_email, 48, y, 220);
    writeLabelValue(
      doc,
      "Minimum price",
      formatCurrency(campaign.min_price),
      300,
      y,
      220,
    );

    y += 64;
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#1C1917")
      .text("Grade distribution", 48, y);
    y += 24;

    for (const [grade, count] of Object.entries(gradeCounts).sort()) {
      doc
        .font("Helvetica")
        .fontSize(12)
        .fillColor("#292524")
        .text(`${grade}: ${count}`, 48, y);
      y += 20;
    }

    y += 16;
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#1C1917")
      .text("Package contents", 48, y);
    y += 24;
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#44403C")
      .text(
        [
          "• campaign spreadsheet (Excel)",
          "• campaign summary (PDF)",
          "• property reports (PDF, one per parcel)",
          "• postcards (PDF, one per parcel)",
          "• satellite images (JPEG, when available)",
        ].join("\n"),
        48,
        y,
        { width: 500 },
      );

    y += 120;
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#1C1917")
      .text("Top prospects", 48, y);
    y += 24;

    const topParcels = parcels
      .filter((parcel) => parcel.grade === "A" || parcel.grade === "B")
      .slice(0, 8);

    if (topParcels.length === 0) {
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#57534E")
        .text("No graded prospects available.", 48, y);
      return;
    }

    for (const parcel of topParcels) {
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#1C1917")
        .text(
          `${parcel.grade ?? "—"} · ${parcel.address ?? parcel.parcel_number}`,
          48,
          y,
          { width: 500 },
        );
      y += 16;
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#57534E")
        .text(parcel.reason ?? "No reason recorded.", 48, y, { width: 500 });
      y += 28;
    }
  });
}
