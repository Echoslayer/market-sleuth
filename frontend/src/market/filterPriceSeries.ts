import type { PricePoint } from "../types/scenario";

export function filterPriceSeries(priceSeries: PricePoint[], days: number | null) {
  if (days === null || priceSeries.length === 0) return priceSeries;
  const latest = new Date(`${priceSeries.at(-1)!.date}T00:00:00Z`).getTime();
  const cutoff = latest - days * 86_400_000;
  return priceSeries.filter((point) => new Date(`${point.date}T00:00:00Z`).getTime() >= cutoff);
}
