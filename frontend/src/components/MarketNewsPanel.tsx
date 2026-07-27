import { useMemo, useState } from "react";
import { selectMarketNews, type MarketNewsFilters } from "../market/selectMarketNews";
import type { MarketInstrument, MarketNewsCategory, MarketNewsItem } from "../types/market";

const categories: MarketNewsCategory[] = ["總經", "產業", "公司", "財報", "政策法規", "其他"];

export function MarketNewsPanel({
  instruments,
  newsItems,
  selectedSymbol,
  onSelectedSymbolChange,
}: {
  instruments: MarketInstrument[];
  newsItems: MarketNewsItem[];
  selectedSymbol: string;
  onSelectedSymbolChange: (symbol: string) => void;
}) {
  const [scope, setScope] = useState<MarketNewsFilters["scope"]>("market");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<MarketNewsCategory[]>([]);
  const filteredNews = useMemo(
    () =>
      selectMarketNews(
        newsItems,
        scope === "market"
          ? { scope, startDate, endDate, categories: selectedCategories }
          : { scope, symbol: selectedSymbol, startDate, endDate, categories: selectedCategories },
      ),
    [endDate, newsItems, scope, selectedCategories, selectedSymbol, startDate],
  );

  function toggleCategory(category: MarketNewsCategory) {
    setSelectedCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category],
    );
  }

  return (
    <section className="mt-8 border-t border-zinc-300 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">市場新聞</h2>
        <span className="text-sm tabular-nums text-zinc-500">{filteredNews.length} 則</span>
      </div>

      <div className="mt-4 border-y border-zinc-300 bg-white px-3 py-4 sm:px-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <span className="mb-1 block text-xs font-medium text-zinc-600">範圍</span>
            <div className="inline-flex overflow-hidden rounded-md border border-zinc-300">
              <ScopeButton active={scope === "market"} onClick={() => setScope("market")}>
                全市場
              </ScopeButton>
              <ScopeButton active={scope === "instrument"} onClick={() => setScope("instrument")}>
                標的
              </ScopeButton>
            </div>
          </div>

          {scope === "instrument" ? (
            <label className="min-w-44 text-xs font-medium text-zinc-600">
              標的
              <select
                value={selectedSymbol}
                onChange={(event) => onSelectedSymbolChange(event.target.value)}
                className="mt-1 block h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-950"
              >
                {instruments.map((instrument) => (
                  <option key={instrument.symbol} value={instrument.symbol}>
                    {instrument.name} ({instrument.symbol})
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="text-xs font-medium text-zinc-600">
            開始日期
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-1 block h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-950"
            />
          </label>

          <label className="text-xs font-medium text-zinc-600">
            結束日期
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
              className="mt-1 block h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-950"
            />
          </label>
        </div>

        <fieldset className="mt-4">
          <legend className="mb-2 text-xs font-medium text-zinc-600">分類</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {categories.map((category) => (
              <label key={category} className="flex min-h-8 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={() => toggleCategory(category)}
                  className="size-4 accent-emerald-700"
                />
                {category}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div aria-live="polite">
        {filteredNews.length ? (
          filteredNews.map((item) => <NewsArticle key={item.id} item={item} />)
        ) : (
          <p className="border-b border-zinc-300 py-10 text-center text-sm text-zinc-500">沒有符合條件的新聞</p>
        )}
      </div>
    </section>
  );
}

function ScopeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-9 px-3 text-sm font-medium ${
        active ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 hover:bg-zinc-100"
      }`}
    >
      {children}
    </button>
  );
}

function NewsArticle({ item }: { item: MarketNewsItem }) {
  return (
    <article className="border-b border-zinc-300 py-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
        <time dateTime={item.date}>{formatDateTime(item.date)}</time>
        <span>{item.categories.join(" · ")}</span>
      </div>
      <h3 className="mt-2 text-base font-semibold leading-6">{item.headline}</h3>
      {item.summaryZh ? <p className="mt-2 text-sm leading-6 text-zinc-800">{item.summaryZh}</p> : null}
      <p className="mt-2 text-sm leading-6 text-zinc-600">{item.content}</p>
      {item.url ? (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm font-medium text-emerald-800 underline underline-offset-4"
        >
          閱讀原文
        </a>
      ) : null}
    </article>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
