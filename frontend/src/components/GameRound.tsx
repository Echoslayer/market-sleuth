import { useEffect, useState } from "react";
import { localJsonScenarioDataProvider } from "../data/scenarioDataProvider";
import {
  canSubmit,
  changeSettings,
  chooseDirection,
  chooseNewsMode,
  decideNews,
  loadScenario,
  type RoundState,
  startRound,
  submit as submitRound,
  toggleNews,
  undoNews,
} from "../game/round";
import { deriveCorrectDirection, type Direction, type RoundScore } from "../game/scoreRound";
import { cn } from "../lib/cn";
import { DirectionPicker } from "./DirectionPicker";
import { NewsList } from "./NewsList";
import { NewsSwipeDeck } from "./NewsSwipeDeck";
import { PriceChart } from "./PriceChart";
import { SettingsDialog } from "./SettingsDialog";

// ponytail: real scenario data is gitignored (licensing), so public deploys
// fall back to the checked-in toy fixture; VITE_SCENARIO_ID seeds the default,
// localStorage (set via the settings dialog) overrides it.
const defaultScenarioId = import.meta.env.VITE_SCENARIO_ID ?? "toy-chipmaker-rally";

function readStoredSettings(): unknown {
  const stored = localStorage.getItem("settings");
  return stored ? JSON.parse(stored) : null;
}

export function GameRound() {
  const [round, setRound] = useState<RoundState>(() => startRound(readStoredSettings(), defaultScenarioId));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { scenario, visibleScenario, activeCutoff, settings, direction, deck, newsMode, score } = round;
  const selectedNewsIds = deck.selectedNewsIds;

  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localJsonScenarioDataProvider
      .getScenario(settings.scenarioId)
      .then((loaded) => setRound((current) => loadScenario(current, loaded)));
  }, [settings.scenarioId]);

  const onToggleNews = (id: string) => setRound((current) => toggleNews(current, id));

  if (!scenario || !visibleScenario) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 text-slate-600">
        <p>Loading scenario…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-10 flex flex-col gap-2 border-b border-slate-300 bg-slate-100 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">{scenario.stockTicker}</p>
            <h1 className="text-3xl font-semibold">{scenario.stockName}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {scenario.dateRange.start} to {scenario.dateRange.end}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {score ? (
              <div className="rounded border border-slate-300 bg-white px-4 py-3 text-sm">
                <span className="font-semibold">News score:</span> {score.newsScore} / {score.newsScoreMax}
              </div>
            ) : null}
            <button
              type="button"
              aria-label="Settings"
              onClick={() => setSettingsOpen(true)}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-lg leading-none text-slate-600 hover:bg-slate-50"
            >
              ⚙︎
            </button>
          </div>
        </header>
        <SettingsDialog
          open={settingsOpen}
          settings={settings}
          onChange={(next) => setRound((current) => changeSettings(current, next))}
          onClose={() => setSettingsOpen(false)}
        />

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Price Chart</h2>
              <p className="text-sm text-slate-600">
                {activeCutoff
                  ? `Showing action through ${activeCutoff} — the rest unlocks after you submit.`
                  : "Visible market action for this round."}
              </p>
            </div>
            <PriceChart priceSeries={visibleScenario.priceSeries} />
          </div>

          <aside className="space-y-4">
            <h2 className="text-lg font-semibold">Direction</h2>
            <DirectionPicker
              value={direction}
              onChange={(next) => setRound((current) => chooseDirection(current, next))}
              disabled={Boolean(score)}
            />
            {!score && settings.debug ? (
              <div className="rounded border border-teal-300 bg-white p-3 text-sm font-medium text-teal-700">
                Correct direction: {deriveCorrectDirection(scenario)}
              </div>
            ) : null}
            {score ? <DirectionResult direction={direction} score={score} /> : null}
            {!score ? (
              <button
                type="button"
                onClick={() => setRound(submitRound)}
                disabled={!canSubmit(round)}
                className="h-11 w-full rounded bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Submit Round
              </button>
            ) : null}
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">News</h2>
              {!score ? (
                <div className="flex rounded border border-slate-300 bg-white text-sm">
                  {(["swipe", "list"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setRound((current) => chooseNewsMode(current, mode))}
                      className={cn(
                        "px-3 py-1.5 font-medium capitalize",
                        newsMode === mode ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {score ? (
              <NewsList
                newsItems={visibleScenario.newsItems}
                selectedNewsIds={selectedNewsIds}
                onToggle={onToggleNews}
                score={score}
              />
            ) : newsMode === "list" ? (
              <NewsList
                newsItems={visibleScenario.newsItems}
                selectedNewsIds={selectedNewsIds}
                onToggle={onToggleNews}
                debugKeyEvents={settings.debug}
              />
            ) : (
              <>
                {settings.debug ? (
                  <p className="rounded border border-teal-300 bg-white p-3 text-sm text-teal-700">
                    Switch to list mode to see key-event marks.
                  </p>
                ) : null}
                <NewsSwipeDeck
                  deck={deck}
                  onDecide={(direction) => setRound((current) => decideNews(current, direction))}
                  onUndo={() => setRound(undoNews)}
                />
              </>
            )}
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
    <div className={cn("rounded border bg-white p-4 text-sm", correct ? "border-teal-300" : "border-red-300")}>
      <p className={cn("font-semibold", correct ? "text-teal-700" : "text-red-700")}>
        {correct ? "Direction correct" : "Direction incorrect"}
      </p>
      <p className="mt-1 text-slate-700">
        You chose {direction}; correct answer was {score.correctDirection}.
      </p>
    </div>
  );
}
