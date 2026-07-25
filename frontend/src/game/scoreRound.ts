import type { NewsItem, Scenario } from "../types/scenario";

export type Direction = "buy" | "hold" | "short";

export type RoundSelection = {
  direction: Direction;
  selectedNewsIds: string[];
};

export type RoundScore = {
  directionScore: 0 | 1;
  correctDirection: Direction;
  newsScore: number;
  newsScoreMax: number;
  breakdown: {
    selectedKeyEvents: NewsItem[];
    missedKeyEvents: NewsItem[];
    falsePositives: NewsItem[];
  };
};

export type ScoreConfig = {
  falsePositiveWeight?: number;
};

export function deriveCorrectDirection(scenario: Scenario): Direction {
  const first = scenario.priceSeries[0];
  const last = scenario.priceSeries.at(-1);

  if (!first || !last) {
    return "hold";
  }

  const change = (last.close - first.close) / first.close;

  // ponytail: simple +/-5% threshold; tune when scenarios need market-relative scoring.
  if (change > 0.05) return "buy";
  if (change < -0.05) return "short";
  return "hold";
}

export function scoreRound(selection: RoundSelection, scenario: Scenario, config: ScoreConfig = {}): RoundScore {
  const correctDirection = deriveCorrectDirection(scenario);
  const selectedIds = new Set(selection.selectedNewsIds);
  const keyEvents = scenario.newsItems.filter((item) => item.isKeyEvent);
  const selectedKeyEvents = keyEvents.filter((item) => selectedIds.has(item.id));
  const missedKeyEvents = keyEvents.filter((item) => !selectedIds.has(item.id));
  const falsePositives = scenario.newsItems.filter((item) => !item.isKeyEvent && selectedIds.has(item.id));
  const newsScoreMax = sumImportance(keyEvents);
  const earned = sumImportance(selectedKeyEvents);
  const penalty = sumImportance(falsePositives) * (config.falsePositiveWeight ?? 1);

  return {
    directionScore: selection.direction === correctDirection ? 1 : 0,
    correctDirection,
    newsScore: clamp(earned - penalty, 0, newsScoreMax),
    newsScoreMax,
    breakdown: {
      selectedKeyEvents,
      missedKeyEvents,
      falsePositives,
    },
  };
}

function sumImportance(items: NewsItem[]) {
  return items.reduce((sum, item) => sum + item.importance, 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
