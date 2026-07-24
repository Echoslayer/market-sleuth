import { CandlestickSeries, createChart, type UTCTimestamp } from "lightweight-charts";
import { useEffect, useRef } from "react";
import type { PricePoint } from "../types/scenario";

type PriceChartProps = {
  priceSeries: PricePoint[];
};

export function PriceChart({ priceSeries }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      height: 320,
      layout: { background: { color: "#f8fafc" }, textColor: "#334155" },
      grid: {
        vertLines: { color: "#e2e8f0" },
        horzLines: { color: "#e2e8f0" },
      },
      rightPriceScale: { borderColor: "#cbd5e1" },
      timeScale: { borderColor: "#cbd5e1" },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#0f766e",
      borderUpColor: "#0f766e",
      wickUpColor: "#0f766e",
      downColor: "#dc2626",
      borderDownColor: "#dc2626",
      wickDownColor: "#dc2626",
    });

    series.setData(priceSeries.map(toCandlestickDatum));
    chart.timeScale().fitContent();

    const resize = () => chart.applyOptions({ width: container.clientWidth });
    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
    };
  }, [priceSeries]);

  return <div ref={containerRef} className="h-80 w-full overflow-hidden rounded border border-slate-200 bg-slate-50" />;
}

function toCandlestickDatum(point: PricePoint) {
  return {
    time: Math.floor(new Date(`${point.date}T00:00:00Z`).getTime() / 1000) as UTCTimestamp,
    open: point.open,
    high: point.high,
    low: point.low,
    close: point.close,
  };
}
