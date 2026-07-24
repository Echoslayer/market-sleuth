// Contract mirrored in pipeline/tests/test_scenario.py — update that key-set
// assertion whenever a field here is added, removed, or renamed.
export type Scenario = {
  id: string;
  stockTicker: string;
  stockName: string;
  dateRange: DateRange;
  priceSeries: PricePoint[];
  newsItems: NewsItem[];
  /** Ordered curator summary of the event timeline. */
  timelineSummary: string[];
  /**
   * If set, pre-submit play hides price/news dated after this cutoff
   * (predictive mode). If absent, everything is visible from the start
   * (detective mode) — the two game modes share this one scenario shape.
   */
  revealCutoffDate?: string;
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
  id: string;
  date: string;
  headline: string;
  url?: string;
  content: string;
  /** Curated importance score from 1 to 5. */
  importance: 1 | 2 | 3 | 4 | 5;
  /** Whether this item belongs in the true key-event set. */
  isKeyEvent: boolean;
};
