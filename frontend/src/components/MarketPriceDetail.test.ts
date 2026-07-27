import { describe, expect, it } from "vitest";
import type { PricePoint } from "../types/scenario";
import { filterPriceSeries } from "./MarketPriceDetail";

const point = (date: string): PricePoint => ({ date, open: 1, high: 1, low: 1, close: 1, volume: 1 });

describe("filterPriceSeries", () => {
  const prices = [point("2025-01-01"), point("2025-03-01"), point("2025-03-31")];

  it("keeps only points inside the selected trailing period, including its boundary", () => {
    expect(filterPriceSeries(prices, 30).map(({ date }) => date)).toEqual(["2025-03-01", "2025-03-31"]);
    expect(filterPriceSeries(prices, null)).toBe(prices);
  });
});
