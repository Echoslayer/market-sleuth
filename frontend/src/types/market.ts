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

export const MARKET_NEWS_CATEGORIES = ["總經", "產業", "公司", "財報", "政策法規", "其他"] as const;
export type MarketNewsCategory = (typeof MARKET_NEWS_CATEGORIES)[number];

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
