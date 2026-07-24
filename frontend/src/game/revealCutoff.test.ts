import { describe, expect, it } from "vitest";
import { toyScenario } from "../fixtures/toyScenario";
import type { Scenario } from "../types/scenario";
import { visibleBeforeSubmit } from "./revealCutoff";

describe("visibleBeforeSubmit", () => {
  it("returns the scenario unchanged when there is no cutoff", () => {
    expect(visibleBeforeSubmit(toyScenario)).toEqual(toyScenario);
  });

  it("hides price points and news dated after the cutoff", () => {
    const scenario: Scenario = { ...toyScenario, revealCutoffDate: "2024-01-04" };

    const visible = visibleBeforeSubmit(scenario);

    expect(visible.priceSeries.map((p) => p.date)).toEqual(["2024-01-02", "2024-01-03", "2024-01-04"]);
    expect(visible.newsItems.map((n) => n.id)).toEqual(["routine-board-meeting", "cloud-customer-order"]);
  });

  it("includes items dated exactly on the cutoff", () => {
    const scenario: Scenario = { ...toyScenario, revealCutoffDate: "2024-01-03" };

    const visible = visibleBeforeSubmit(scenario);

    expect(visible.priceSeries.at(-1)?.date).toBe("2024-01-03");
    expect(visible.newsItems.some((n) => n.date === "2024-01-03")).toBe(true);
  });
});
