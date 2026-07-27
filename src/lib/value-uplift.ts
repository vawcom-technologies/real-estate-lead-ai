/** Estimated property value uplift from a 20 m² terrace (~7% of sale price). */
export const VALUE_UPLIFT_RATE = 0.07;

/**
 * Sale price × 7%, rounded to the nearest thousand euros.
 * Example: 466_150 × 0.07 = 32_630 → 33_000 €
 */
export function estimateValueUplift(
  salePrice: { toString(): string } | number | null | undefined,
): number | null {
  if (salePrice === null || salePrice === undefined) {
    return null;
  }

  const amount = Number(salePrice.toString());
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round((amount * VALUE_UPLIFT_RATE) / 1000) * 1000;
}

export function formatValueUplift(euros: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(euros);
}
