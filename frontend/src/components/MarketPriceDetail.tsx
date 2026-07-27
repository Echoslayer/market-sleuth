import {
  CandlestickSeries,
  createChart,
  HistogramSeries,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import type { PricePoint } from "../types/scenario";

const periods = [
  ["1m", "1 個月", 30],
  ["3m", "3 個月", 90],
  ["1y", "1 年", 365],
  ["all", "全部", null],
] as const;

type Period = (typeof periods)[number][0];

export function MarketPriceDetail({ priceSeries }: { priceSeries: PricePoint[] }) {
  const [period, setPeriod] = useState<Period>("3m");
  const visiblePrices = filterPriceSeries(priceSeries, periods.find(([id]) => id === period)?.[2] ?? null);

  return (
    <section className="mt-4" aria-labelledby="price-detail-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 id="price-detail-heading" className="text-base font-semibold">
          價格走勢
        </h3>
        <div className="flex flex-wrap gap-1" aria-label="走勢期間">
          {periods.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={period === id}
              onClick={() => setPeriod(id)}
              className={`min-h-9 border px-3 text-sm ${
                period === id
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {visiblePrices.length ? (
        <MarketPriceChart priceSeries={visiblePrices} />
      ) : (
        <div className="grid h-72 place-items-center border border-zinc-300 bg-white text-sm text-zinc-500" role="status">
          此標的暫無價格資料
        </div>
      )}
    </section>
  );
}

export function filterPriceSeries(priceSeries: PricePoint[], days: number | null) {
  if (days === null || priceSeries.length === 0) return priceSeries;
  const latest = new Date(`${priceSeries.at(-1)!.date}T00:00:00Z`).getTime();
  const cutoff = latest - days * 86_400_000;
  return priceSeries.filter((point) => new Date(`${point.date}T00:00:00Z`).getTime() >= cutoff);
}

function MarketPriceChart({ priceSeries }: { priceSeries: PricePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      height: 400,
      layout: { background: { color: "#ffffff" }, textColor: "#52525b" },
      grid: {
        vertLines: { color: "#f4f4f5" },
        horzLines: { color: "#e4e4e7" },
      },
      rightPriceScale: {
        borderColor: "#d4d4d8",
        scaleMargins: { top: 0.08, bottom: 0.28 },
      },
      timeScale: { borderColor: "#d4d4d8" },
      localization: { locale: "zh-TW" },
    });

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: "#b91c1c",
      borderUpColor: "#b91c1c",
      wickUpColor: "#b91c1c",
      downColor: "#047857",
      borderDownColor: "#047857",
      wickDownColor: "#047857",
    });
    candles.setData(priceSeries.map(toCandlestickDatum));

    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } });
    volume.setData(
      priceSeries.map((point) => ({
        time: toTimestamp(point.date),
        value: point.volume,
        color: point.close >= point.open ? "#b91c1c66" : "#04785766",
      })),
    );

    chart.timeScale().fitContent();
    const resize = () => chart.applyOptions({ width: container.clientWidth });
    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
    };
  }, [priceSeries]);

  return (
    <div
      ref={containerRef}
      className="h-[400px] w-full overflow-hidden border border-zinc-300 bg-white"
      aria-label="日 K 線與成交量圖"
    />
  );
}

function toCandlestickDatum(point: PricePoint) {
  return {
    time: toTimestamp(point.date),
    open: point.open,
    high: point.high,
    low: point.low,
    close: point.close,
  };
}

function toTimestamp(date: string) {
  return Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 1000) as UTCTimestamp;
}
