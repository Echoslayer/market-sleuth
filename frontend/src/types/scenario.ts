export type Scenario = {
  id: string;
  stockTicker: string;
  stockName: string;
  dateRange: DateRange;
  priceSeries: PricePoint[];
  newsItems: NewsItem[];
  /** Ordered curator summary of the event timeline. */
  timelineSummary: string[];
};

export type DateRange = {
  start: string;
  end: string;
};

export type PricePoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type NewsItem = {
  date: string;
  headline: string;
  content: string;
  /** Curated importance score from 1 to 5. */
  importance: 1 | 2 | 3 | 4 | 5;
  /** Whether this item belongs in the true key-event set. */
  isKeyEvent: boolean;
};
