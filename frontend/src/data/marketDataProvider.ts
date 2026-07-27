import type { MarketSnapshot } from "../types/market";
import { toyMarketSnapshot } from "../fixtures/toyMarketSnapshot";

export async function getMarketSnapshot(id: string): Promise<MarketSnapshot> {
  if (id === toyMarketSnapshot.id) return toyMarketSnapshot;
  const response = await fetch(`${import.meta.env.BASE_URL}data/${id}.json`);
  if (!response.ok) throw new Error(`Failed to load market snapshot "${id}": ${response.status}`);
  return (await response.json()) as MarketSnapshot;
}
