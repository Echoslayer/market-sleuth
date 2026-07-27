import type { MarketSnapshot } from "../types/market";

export const toyMarketSnapshot = {
  id: "toy-market-snapshot",
  generatedAt: "2026-07-24T14:30:00+08:00",
  instruments: [
    instrument("^TWII", "加權指數", "index"),
    instrument("2330.TW", "台積電", "stock"),
    instrument("2317.TW", "鴻海", "stock"),
    instrument("2454.TW", "聯發科", "stock"),
  ],
  priceSeries: {
    "^TWII": prices(23100, 23220, 23240, 23380, 4_020_000, 4_310_000),
    "2330.TW": prices(1030, 1040, 1045, 1065, 28_100_000, 31_900_000),
    "2317.TW": prices(219, 220, 220.5, 223, 52_700_000, 56_300_000),
    "2454.TW": prices(1420, 1430, 1435, 1450, 6_100_000, 6_800_000),
  },
  newsItems: [
    {
      id: "toy-market-1",
      date: "2026-07-24T10:00:00+08:00",
      headline: "示範：電子權值股帶動大盤",
      content: "這是可公開再散布的合成示範內容。",
      summaryZh: "電子類股走強，帶動示範市場指數上升。",
      symbols: [],
      categories: ["總經", "產業"],
    },
    {
      id: "toy-stock-1",
      date: "2026-07-24T11:00:00+08:00",
      headline: "示範：晶圓代工需求展望",
      content: "這是可公開再散布的合成示範內容。",
      symbols: ["2330.TW"],
      categories: ["產業", "公司"],
    },
  ],
} satisfies MarketSnapshot;

function instrument(symbol: string, name: string, kind: "index" | "stock") {
  return { symbol, name, kind, exchange: "TWSE", currency: "TWD", timezone: "Asia/Taipei" };
}

function prices(
  firstOpen: number,
  firstClose: number,
  secondOpen: number,
  secondClose: number,
  firstVolume: number,
  secondVolume: number,
) {
  return [
    {
      date: "2026-07-23",
      open: firstOpen,
      high: Math.max(firstOpen, firstClose),
      low: Math.min(firstOpen, firstClose),
      close: firstClose,
      volume: firstVolume,
    },
    {
      date: "2026-07-24",
      open: secondOpen,
      high: Math.max(secondOpen, secondClose),
      low: Math.min(secondOpen, secondClose),
      close: secondClose,
      volume: secondVolume,
    },
  ];
}
