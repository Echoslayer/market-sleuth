import { useEffect, useState } from "react";
import { localJsonScenarioDataProvider } from "../data/scenarioDataProvider";
import { visibleBeforeSubmit } from "../game/revealCutoff";
import { type Direction, type RoundScore, scoreRound } from "../game/scoreRound";
import type { Scenario } from "../types/scenario";
import { DirectionPicker } from "./DirectionPicker";
import { NewsList } from "./NewsList";
import { PriceChart } from "./PriceChart";

export function GameRound() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [direction, setDirection] = useState<Direction>("hold");
  const [selectedNewsIds, setSelectedNewsIds] = useState<string[]>([]);
  const [score, setScore] = useState<RoundScore | null>(null);

  useEffect(() => {
    // ponytail: real scenario data is gitignored (licensing), so public
    // deploys fall back to the checked-in toy fixture; override locally via
    // frontend/.env.local (VITE_SCENARIO_ID=tsmc-2023-ai-rally).
    const scenarioId = import.meta.env.VITE_SCENARIO_ID ?? "toy-chipmaker-rally";
    localJsonScenarioDataProvider.getScenario(scenarioId).then(setScenario);
  }, []);

  const toggleNews = (id: string) => {
    setSelectedNewsIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    );
  };

  const submit = () => {
    if (!scenario) return;
    setScore(scoreRound({ direction, selectedNewsIds }, scenario));
  };

  if (!scenario) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 text-slate-600">
        <p>Loading scenario…</p>
      </main>
    );
  }

  // Before submit, a scenario with a revealCutoffDate only shows what a
  // player at that point in time would have seen (predictive mode). With
  // no cutoff, everything is visible from the start (detective mode).
  // scoreRound always sees the full scenario — a hidden key event the
  // player couldn't select just shows up as "missed" once revealed.
  const displayScenario = score ? scenario : visibleBeforeSubmit(scenario);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2 border-b border-slate-300 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">{scenario.stockTicker}</p>
            <h1 className="text-3xl font-semibold">{scenario.stockName}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {scenario.dateRange.start} to {scenario.dateRange.end}
            </p>
          </div>
          {score ? (
            <div className="rounded border border-slate-300 bg-white px-4 py-3 text-sm">
              <span className="font-semibold">News score:</span> {score.newsScore} / {score.newsScoreMax}
            </div>
          ) : null}
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Price Chart</h2>
              <p className="text-sm text-slate-600">
                {!score && scenario.revealCutoffDate
                  ? `Showing action through ${scenario.revealCutoffDate} — the rest unlocks after you submit.`
                  : "Visible market action for this round."}
              </p>
            </div>
            <PriceChart priceSeries={displayScenario.priceSeries} />
          </div>

          <aside className="space-y-4">
            <h2 className="text-lg font-semibold">Direction</h2>
            <DirectionPicker value={direction} onChange={setDirection} disabled={Boolean(score)} />
            {score ? <DirectionResult direction={direction} score={score} /> : null}
            {!score ? (
              <button
                type="button"
                onClick={submit}
                className="h-11 w-full rounded bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Submit Round
              </button>
            ) : null}
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">News</h2>
            <NewsList newsItems={displayScenario.newsItems} selectedNewsIds={selectedNewsIds} onToggle={toggleNews} score={score ?? undefined} />
          </div>

          {score ? (
            <aside className="space-y-4">
              <h2 className="text-lg font-semibold">Timeline</h2>
              <ol className="space-y-3">
                {scenario.timelineSummary.map((item) => (
                  <li key={item} className="rounded border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                    {item}
                  </li>
                ))}
              </ol>
            </aside>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function DirectionResult({ direction, score }: { direction: Direction; score: RoundScore }) {
  const correct = score.directionScore === 1;

  return (
    <div className={`rounded border bg-white p-4 text-sm ${correct ? "border-teal-300" : "border-red-300"}`}>
      <p className={correct ? "font-semibold text-teal-700" : "font-semibold text-red-700"}>
        {correct ? "Direction correct" : "Direction incorrect"}
      </p>
      <p className="mt-1 text-slate-700">
        You chose {direction}; correct answer was {score.correctDirection}.
      </p>
    </div>
  );
}
