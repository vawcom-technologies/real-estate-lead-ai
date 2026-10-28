export function formatNumber(value: number): string {
  return value.toLocaleString("fr-FR");
}

export function formatEuro(value: number): string {
  return `€${formatNumber(Math.round(value))}`;
}

export function decimalToNumber(
  value: { toString(): string } | number | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  const amount = Number(value.toString());
  return Number.isFinite(amount) ? amount : null;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function priceThresholdLabel(value: number): string {
  if (value >= 1000) {
    return `€${Math.round(value / 1000)}K+ properties`;
  }
  return `${formatEuro(value)}+ properties`;
}
