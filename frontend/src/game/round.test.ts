import { describe, expect, it } from "vitest";
import { toyScenario } from "../fixtures/toyScenario";
import type { Scenario } from "../types/scenario";
import {
  canSubmit,
  changeSettings,
  chooseDirection,
  chooseNewsMode,
  decideNews,
  loadScenario,
  startRound,
  submit,
  toggleNews,
  undoNews,
} from "./round";

// The toy fixture plus a cutoff that hides the second key event
// (shipment-estimates-raised, 2024-01-05) from pre-submit play.
const cutoffScenario: Scenario = { ...toyScenario, revealCutoffDate: "2024-01-04" };

const started = (stored: unknown = {}) => startRound(stored, "toy-chipmaker-rally");
const loaded = () => loadScenario(started(), cutoffScenario);

describe("round invariants", () => {
  it("keeps swipe progress and answers across news mode switches", () => {
    const decided = decideNews(loaded(), "right");
    const switched = chooseNewsMode(chooseNewsMode(decided, "list"), "swipe");

    expect(switched.deck.history).toHaveLength(1);
    expect(switched.deck.selectedNewsIds).toEqual(["routine-board-meeting"]);
  });

  it("scores against the full scenario, so a hidden key event counts as missed", () => {
    const state = submit(chooseDirection(loaded(), "buy"));

    // shipment-estimates-raised was never visible, but it still counts.
    expect(state.score?.newsScoreMax).toBe(9);
    expect(state.score?.breakdown.missedKeyEvents.map((item) => item.id)).toContain("shipment-estimates-raised");
  });

  it("keeps visibleScenario identity across transitions that cannot change it", () => {
    const state = loaded();

    expect(chooseDirection(state, "buy").visibleScenario).toBe(state.visibleScenario);
    expect(chooseNewsMode(state, "list").visibleScenario).toBe(state.visibleScenario);
    expect(decideNews(state, "right").visibleScenario).toBe(state.visibleScenario);
  });
});

describe("reveal precedence", () => {
  it("falls back to the scenario's own cutoff when the override is empty", () => {
    const state = loaded();

    expect(state.activeCutoff).toBe("2024-01-04");
    expect(state.visibleScenario?.newsItems.map((item) => item.id)).toEqual([
      "routine-board-meeting",
      "cloud-customer-order",
    ]);
    expect(state.visibleScenario?.priceSeries).toHaveLength(3);
  });

  it("applies a manual cutoff override over the scenario's own cutoff", () => {
    const state = loaded();
    const overridden = changeSettings(state, { ...state.settings, cutoffOverride: "2024-01-02" });

    expect(overridden.activeCutoff).toBe("2024-01-02");
    expect(overridden.visibleScenario?.newsItems.map((item) => item.id)).toEqual(["routine-board-meeting"]);
  });

  it("lets reveal-all win over a manual cutoff override", () => {
    const state = loaded();
    const revealed = changeSettings(state, { ...state.settings, revealAll: true, cutoffOverride: "2024-01-02" });

    expect(revealed.activeCutoff).toBeUndefined();
    expect(revealed.visibleScenario).toBe(revealed.scenario);
  });

  it("reveals the full scenario after submit", () => {
    const state = submit(loaded());

    expect(state.activeCutoff).toBeUndefined();
    expect(state.visibleScenario).toBe(state.scenario);
  });

  it("hides nothing in detective mode, keeping the scenario's identity", () => {
    const state = loadScenario(started(), toyScenario);

    expect(state.activeCutoff).toBeUndefined();
    expect(state.visibleScenario).toBe(state.scenario);
  });
});

describe("toggleNews", () => {
  it("decides left and right, then undo restores the previous card and answer", () => {
    const left = decideNews(loaded(), "left");
    const right = decideNews(left, "right");
    const undone = undoNews(right);

    expect(left.deck.selectedNewsIds).toEqual([]);
    expect(right.deck.selectedNewsIds).toEqual(["cloud-customer-order"]);
    expect(undone.deck.remaining[0].id).toBe("cloud-customer-order");
    expect(undone.deck.selectedNewsIds).toEqual([]);
  });

  it("keeps a newer list answer when undoing an older swipe", () => {
    const swiped = decideNews(loaded(), "left");
    const listChanged = toggleNews(swiped, "routine-board-meeting");
    const undone = undoNews(listChanged);

    expect(undone.deck.remaining[0].id).toBe("routine-board-meeting");
    expect(undone.deck.selectedNewsIds).toEqual(["routine-board-meeting"]);
  });

  it("lets a new swipe replace a list answer", () => {
    const listChanged = toggleNews(loaded(), "routine-board-meeting");
    const swiped = decideNews(listChanged, "left");

    expect(swiped.deck.selectedNewsIds).toEqual([]);
    expect(swiped.listOverrideIds).toEqual([]);
  });

  it("adds and removes an id without touching the rest of the round", () => {
    const state = loaded();
    const picked = toggleNews(state, "cloud-customer-order");

    expect(picked.deck.selectedNewsIds).toEqual(["cloud-customer-order"]);
    expect(toggleNews(picked, "cloud-customer-order").deck.selectedNewsIds).toEqual([]);
    expect(picked.visibleScenario).toBe(state.visibleScenario);
  });
});

describe("changeSettings", () => {
  it("clears the round when the scenario changes", () => {
    const mid = chooseDirection(decideNews(loaded(), "right"), "buy");
    const after = changeSettings(mid, { ...mid.settings, scenarioId: "nflx-2022-subscriber-shock" });

    expect(after.scenario).toBeNull();
    expect(after.visibleScenario).toBeNull();
    expect(after.deck.selectedNewsIds).toEqual([]);
    expect(after.deck.history).toEqual([]);
    expect(after.direction).toBe("hold");
    expect(after.score).toBeNull();
  });

  it("keeps the round when an unrelated setting changes", () => {
    const mid = chooseDirection(decideNews(loaded(), "right"), "buy");
    const after = changeSettings(mid, { ...mid.settings, falsePositiveWeight: 2 });

    expect(after.deck.selectedNewsIds).toEqual(["routine-board-meeting"]);
    expect(after.direction).toBe("buy");
    expect(after.scenario).toBe(mid.scenario);
  });

  it("resets the deck when settings change the visible news", () => {
    const mid = decideNews(loaded(), "right");
    const after = changeSettings(mid, { ...mid.settings, cutoffOverride: "2024-01-02" });

    expect(after.deck.history).toEqual([]);
    expect(after.deck.selectedNewsIds).toEqual([]);
    expect(after.deck.remaining.map((item) => item.id)).toEqual(["routine-board-meeting"]);
  });

  it("carries the false-positive weight through to scoring", () => {
    const picked = toggleNews(toggleNews(loaded(), "cloud-customer-order"), "routine-board-meeting");
    const lenient = changeSettings(picked, { ...picked.settings, falsePositiveWeight: 0 });

    expect(submit(picked).score?.newsScore).toBe(4);
    expect(submit(lenient).score?.newsScore).toBe(5);
  });
});

describe("startRound", () => {
  it("fills in defaults for fields missing from a stored settings blob", () => {
    const state = startRound({ scenarioId: "nflx-2022-subscriber-shock", revealAll: true }, "toy-chipmaker-rally");

    expect(state.settings).toEqual({
      scenarioId: "nflx-2022-subscriber-shock",
      revealAll: true,
      falsePositiveWeight: 1,
      cutoffOverride: "",
      debug: false,
    });
  });

  it("uses the default scenario id when nothing is stored", () => {
    expect(startRound(null, "toy-chipmaker-rally").settings.scenarioId).toBe("toy-chipmaker-rally");
  });
});

describe("canSubmit", () => {
  it("requires a finished deck in swipe mode", () => {
    const state = loaded();

    expect(canSubmit(state)).toBe(false);
    expect(canSubmit(decideNews(decideNews(state, "left"), "left"))).toBe(true);
  });

  it("does not require a finished deck in list mode", () => {
    expect(canSubmit(chooseNewsMode(loaded(), "list"))).toBe(true);
  });

  it("is false before a scenario has loaded and after submit", () => {
    expect(canSubmit(started())).toBe(false);
    expect(canSubmit(submit(chooseNewsMode(loaded(), "list")))).toBe(false);
  });
});
