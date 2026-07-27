import { describe, expect, it } from "vitest";
import type { MarketNewsItem } from "../types/market";
import { selectMarketNews } from "./selectMarketNews";

const news: MarketNewsItem[] = [
  item("market-old", "2026-07-22T09:00:00+08:00", [], ["總經"]),
  item("market-new", "2026-07-24T09:00:00+08:00", [], ["政策法規"]),
  item("tsmc-earnings", "2026-07-23T09:00:00+08:00", ["2330.TW"], ["公司", "財報"]),
  item("hon-hai", "2026-07-24T10:00:00+08:00", ["2317.TW"], ["公司"]),
];

describe("selectMarketNews", () => {
  it("selects market or instrument scope and sorts newest first", () => {
    expect(selectMarketNews(news, { scope: "market" }).map(({ id }) => id)).toEqual([
      "market-new",
      "market-old",
    ]);
    expect(
      selectMarketNews(news, { scope: "instrument", symbol: "2330.TW" }).map(({ id }) => id),
    ).toEqual(["tsmc-earnings"]);
  });

  it("includes both date boundaries", () => {
    expect(
      selectMarketNews(news, {
        scope: "market",
        startDate: "2026-07-22",
        endDate: "2026-07-24",
      }).map(({ id }) => id),
    ).toEqual(["market-new", "market-old"]);
  });

  it("uses the Taipei calendar date regardless of the source offset", () => {
    const afterMidnightInTaipei = [item("late", "2026-07-24T17:00:00Z", [], ["總經"])];

    expect(
      selectMarketNews(afterMidnightInTaipei, {
        scope: "market",
        startDate: "2026-07-25",
        endDate: "2026-07-25",
      }).map(({ id }) => id),
    ).toEqual(["late"]);
  });

  it("matches any selected category", () => {
    expect(
      selectMarketNews(news, {
        scope: "instrument",
        symbol: "2330.TW",
        categories: ["總經", "財報"],
      }).map(({ id }) => id),
    ).toEqual(["tsmc-earnings"]);
  });
});

function item(
  id: string,
  date: string,
  symbols: string[],
  categories: MarketNewsItem["categories"],
): MarketNewsItem {
  return { id, date, headline: id, content: id, symbols, categories };
}
