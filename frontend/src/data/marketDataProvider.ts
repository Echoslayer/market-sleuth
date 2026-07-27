import type { MarketSnapshot } from "../types/market";

export async function getMarketSnapshot(id: string): Promise<MarketSnapshot> {
  const response = await fetch(`/data/${id}.json`);
  if (!response.ok) throw new Error(`Failed to load market snapshot "${id}": ${response.status}`);
  return (await response.json()) as MarketSnapshot;
}
