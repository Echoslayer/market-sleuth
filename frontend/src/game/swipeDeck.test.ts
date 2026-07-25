import { describe, expect, it } from "vitest";
import { createSwipeDeck, decide, isComplete, undo } from "./swipeDeck";

const cards = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("swipeDeck", () => {
  it("builds selectedNewsIds from right swipes only", () => {
    const state = decide(decide(createSwipeDeck(cards), "right"), "left");

    expect(state.selectedNewsIds).toEqual(["a"]);
    expect(state.history.map((decision) => ({ id: decision.card.id, kept: decision.kept }))).toEqual([
      { id: "a", kept: true },
      { id: "b", kept: false },
    ]);
  });

  it("undo restores the previous card and reverts its selection", () => {
    const state = undo(decide(createSwipeDeck(cards), "right"));

    expect(state.remaining.map((card) => card.id)).toEqual(["a", "b", "c"]);
    expect(state.selectedNewsIds).toEqual([]);
  });

  it("decides through to complete", () => {
    const state = decide(decide(decide(createSwipeDeck(cards), "right"), "left"), "right");

    expect(isComplete(state)).toBe(true);
    expect(state.remaining).toEqual([]);
    expect(state.selectedNewsIds).toEqual(["a", "c"]);
  });

  it("undo at start is a no-op", () => {
    const state = createSwipeDeck(cards);

    expect(undo(state)).toBe(state);
  });
});
