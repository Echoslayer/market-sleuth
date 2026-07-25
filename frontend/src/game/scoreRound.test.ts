import { describe, expect, it } from "vitest";
import { toyScenario } from "../fixtures/toyScenario";
import type { Scenario } from "../types/scenario";
import { scoreRound } from "./scoreRound";

const makeScenario = (closes: number[]): Scenario => ({
  ...toyScenario,
  priceSeries: closes.map((close, index) => ({
    date: `2024-01-0${index + 1}`,
    open: close,
    high: close,
    low: close,
    close,
    volume: 1,
  })),
});

describe("scoreRound", () => {
  it("scores a correct buy direction", () => {
    const score = scoreRound({ direction: "buy", selectedNewsIds: [] }, makeScenario([100, 106]));

    expect(score.correctDirection).toBe("buy");
    expect(score.directionScore).toBe(1);
  });

  it("scores an incorrect buy direction", () => {
    const score = scoreRound({ direction: "hold", selectedNewsIds: [] }, makeScenario([100, 106]));

    expect(score.correctDirection).toBe("buy");
    expect(score.directionScore).toBe(0);
  });

  it("scores a correct short direction", () => {
    const score = scoreRound({ direction: "short", selectedNewsIds: [] }, makeScenario([100, 94]));

    expect(score.correctDirection).toBe("short");
    expect(score.directionScore).toBe(1);
  });

  it("scores a correct hold direction", () => {
    const score = scoreRound({ direction: "hold", selectedNewsIds: [] }, makeScenario([100, 104]));

    expect(score.correctDirection).toBe("hold");
    expect(score.directionScore).toBe(1);
  });

  it("awards max news score when all key events are selected", () => {
    const score = scoreRound(
      { direction: "buy", selectedNewsIds: ["cloud-customer-order", "shipment-estimates-raised"] },
      toyScenario,
    );

    expect(score.newsScore).toBe(9);
    expect(score.newsScoreMax).toBe(9);
    expect(score.breakdown.selectedKeyEvents).toHaveLength(2);
    expect(score.breakdown.missedKeyEvents).toHaveLength(0);
  });

  it("awards zero news score when nothing is selected", () => {
    const score = scoreRound({ direction: "buy", selectedNewsIds: [] }, toyScenario);

    expect(score.newsScore).toBe(0);
    expect(score.newsScoreMax).toBe(9);
  });

  it("applies partial credit and false-positive penalty", () => {
    const score = scoreRound(
      { direction: "buy", selectedNewsIds: ["cloud-customer-order", "routine-board-meeting"] },
      toyScenario,
    );

    expect(score.newsScore).toBe(4);
    expect(score.breakdown.selectedKeyEvents.map((item) => item.id)).toEqual(["cloud-customer-order"]);
    expect(score.breakdown.falsePositives.map((item) => item.id)).toEqual(["routine-board-meeting"]);
  });

  it("can disable false-positive penalty", () => {
    const score = scoreRound(
      { direction: "buy", selectedNewsIds: ["cloud-customer-order", "routine-board-meeting"] },
      toyScenario,
      { falsePositiveWeight: 0 },
    );

    expect(score.newsScore).toBe(5);
  });

  it("can double false-positive penalty and still clamps at zero", () => {
    const score = scoreRound(
      { direction: "buy", selectedNewsIds: ["routine-board-meeting", "utility-maintenance"] },
      toyScenario,
      { falsePositiveWeight: 2 },
    );

    expect(score.newsScore).toBe(0);
  });

  it("does not let penalties push news score below zero", () => {
    const score = scoreRound(
      { direction: "buy", selectedNewsIds: ["routine-board-meeting", "utility-maintenance"] },
      toyScenario,
    );

    expect(score.newsScore).toBe(0);
  });
});
