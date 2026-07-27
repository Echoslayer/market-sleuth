import type { PricePoint } from "./scenario";

export type MarketSnapshot = {
  id: string;
  generatedAt: string;
  instruments: MarketInstrument[];
  priceSeries: Record<string, PricePoint[]>;
  newsItems: MarketNewsItem[];
};

export type MarketInstrument = {
  symbol: string;
  name: string;
  kind: "index" | "stock";
  exchange: string;
  currency: string;
  timezone: string;
};

export type MarketNewsCategory = "總經" | "產業" | "公司" | "財報" | "政策法規" | "其他";

export type MarketNewsItem = {
  id: string;
  date: string;
  headline: string;
  content: string;
  url?: string;
  summaryZh?: string;
  symbols: string[];
  categories: MarketNewsCategory[];
};
