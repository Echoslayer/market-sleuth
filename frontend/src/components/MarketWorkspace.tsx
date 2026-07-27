import { useEffect, useState } from "react";
import { getMarketSnapshot } from "../data/marketDataProvider";
import type { MarketInstrument, MarketSnapshot } from "../types/market";

const snapshotId = import.meta.env.VITE_MARKET_SNAPSHOT_ID ?? "toy-market-snapshot";

export function MarketWorkspace() {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState("");

  useEffect(() => {
    getMarketSnapshot(snapshotId).then((loaded) => {
      setSnapshot(loaded);
      setSelectedSymbol(loaded.instruments[0]?.symbol ?? "");
    });
  }, []);

  if (!snapshot) {
    return <main className="grid min-h-screen place-items-center bg-zinc-100 text-zinc-600">載入市場資料...</main>;
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-950 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-300 pb-5">
          <div>
            <p className="text-sm font-medium text-emerald-700">台股市場工作台</p>
            <h1 className="text-2xl font-semibold">市場總覽</h1>
          </div>
          <p className="text-sm text-zinc-600">更新時間：{formatDateTime(snapshot.generatedAt)}</p>
        </header>

        <section className="mt-6">
          <h2 className="mb-3 text-base font-semibold">指數與自選股</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {snapshot.instruments.map((instrument) => (
              <InstrumentButton
                key={instrument.symbol}
                instrument={instrument}
                prices={snapshot.priceSeries[instrument.symbol] ?? []}
                selected={selectedSymbol === instrument.symbol}
                onSelect={() => setSelectedSymbol(instrument.symbol)}
              />
            ))}
          </div>
        </section>

        <section className="mt-6 border-t border-zinc-300 pt-5">
          <p className="text-sm text-zinc-500">目前標的</p>
          <h2 className="text-xl font-semibold">
            {snapshot.instruments.find((item) => item.symbol === selectedSymbol)?.name}{" "}
            <span className="text-sm font-normal text-zinc-500">{selectedSymbol}</span>
          </h2>
        </section>
      </div>
    </main>
  );
}

function InstrumentButton({
  instrument,
  prices,
  selected,
  onSelect,
}: {
  instrument: MarketInstrument;
  prices: MarketSnapshot["priceSeries"][string];
  selected: boolean;
  onSelect: () => void;
}) {
  const latest = prices.at(-1);
  const previous = prices.at(-2);
  const change = latest && previous ? ((latest.close - previous.close) / previous.close) * 100 : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`min-h-28 border bg-white p-4 text-left hover:border-zinc-500 ${
        selected ? "border-emerald-700 ring-1 ring-emerald-700" : "border-zinc-300"
      }`}
    >
      <span className="block text-xs text-zinc-500">{instrument.symbol}</span>
      <span className="block font-semibold">{instrument.name}</span>
      <span className="mt-3 block text-lg tabular-nums">{latest ? formatPrice(latest.close) : "無資料"}</span>
      {change !== null ? (
        <span className={`text-sm tabular-nums ${change >= 0 ? "text-red-700" : "text-emerald-700"}`}>
          {change >= 0 ? "+" : ""}
          {change.toFixed(2)}%
        </span>
      ) : null}
    </button>
  );
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 2 }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
