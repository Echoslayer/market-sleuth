import type { Scenario } from "../types/scenario";

/**
 * The subset of a scenario visible before the player submits. With no
 * cutoff, everything is visible (detective mode). With a cutoff, price
 * points and news dated after it are hidden (predictive mode) — the
 * player can only pick from what's actually shown.
 */
export function visibleBeforeSubmit(scenario: Scenario): Scenario {
  const cutoff = scenario.revealCutoffDate;
  if (!cutoff) return scenario;

  return {
    ...scenario,
    priceSeries: scenario.priceSeries.filter((point) => point.date <= cutoff),
    newsItems: scenario.newsItems.filter((item) => item.date <= cutoff),
  };
}
