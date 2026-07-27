import type { MarketNewsCategory, MarketNewsItem } from "../types/market";
import { taipeiDate } from "./taipeiDate";

type CommonFilters = {
  startDate?: string;
  endDate?: string;
  categories?: MarketNewsCategory[];
};

export type MarketNewsFilters = CommonFilters &
  ({ scope: "market" } | { scope: "instrument"; symbol: string });

export function selectMarketNews(items: MarketNewsItem[], filters: MarketNewsFilters) {
  return items
    .filter((item) => {
      const date = taipeiDate(item.date);
      return (
        (filters.scope === "market"
          ? item.symbols.length === 0
          : item.symbols.includes(filters.symbol)) &&
        (!filters.startDate || date >= filters.startDate) &&
        (!filters.endDate || date <= filters.endDate) &&
        (!filters.categories?.length ||
          filters.categories.some((category) => item.categories.includes(category)))
      );
    })
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
