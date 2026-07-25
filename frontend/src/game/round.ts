import type { Scenario } from "../types/scenario";
import { visibleBeforeSubmit } from "./revealCutoff";
import { type Direction, type RoundScore, scoreRound } from "./scoreRound";

export type NewsMode = "swipe" | "list";

export type Settings = {
  scenarioId: string;
  revealAll: boolean;
  falsePositiveWeight: number;
  cutoffOverride: string;
  debug: boolean;
};

export type RoundState = {
  settings: Settings;
  /** The whole truth. scoreRound only ever sees this one. */
  scenario: Scenario | null;
  /** What the player is allowed to see right now — derived, see withVisible. */
  visibleScenario: Scenario | null;
  /** The cutoff currently being applied, or undefined when nothing is hidden. */
  activeCutoff: string | undefined;
  direction: Direction;
  selectedNewsIds: string[];
  newsDeckComplete: boolean;
  newsMode: NewsMode;
  score: RoundScore | null;
};

// newsMode is deliberately absent: it is a display preference and survives a
// scenario switch, matching how the settings themselves survive one.
const blankRound: Omit<RoundState, "settings" | "newsMode"> = {
  scenario: null,
  visibleScenario: null,
  activeCutoff: undefined,
  direction: "hold",
  selectedNewsIds: [],
  newsDeckComplete: false,
  score: null,
};

export function startRound(stored: unknown, defaultScenarioId: string): RoundState {
  return { ...blankRound, newsMode: "swipe", settings: mergeSettings(stored, defaultScenarioId) };
}

export function loadScenario(state: RoundState, scenario: Scenario): RoundState {
  return withVisible({ ...state, scenario });
}

export function changeSettings(state: RoundState, settings: Settings): RoundState {
  const switched = settings.scenarioId !== state.settings.scenarioId;
  return withVisible({ ...state, ...(switched ? blankRound : {}), settings });
}

export function submit(state: RoundState): RoundState {
  if (!state.scenario) return state;

  return withVisible({
    ...state,
    score: scoreRound({ direction: state.direction, selectedNewsIds: state.selectedNewsIds }, state.scenario, {
      falsePositiveWeight: state.settings.falsePositiveWeight,
    }),
  });
}

// The three transitions below cannot change the cutoff or the scenario, so they
// pass visibleScenario through untouched. Running withVisible here would hand
// newsItems a fresh array identity on every keystroke, which resets the swipe
// deck — the exact coupling this module exists to remove.
export function chooseDirection(state: RoundState, direction: Direction): RoundState {
  return { ...state, direction };
}

export function chooseNewsMode(state: RoundState, newsMode: NewsMode): RoundState {
  return { ...state, newsMode };
}

export function updateNews(state: RoundState, selectedNewsIds: string[], newsDeckComplete: boolean): RoundState {
  return { ...state, selectedNewsIds, newsDeckComplete };
}

export function toggleNews(state: RoundState, id: string): RoundState {
  return {
    ...state,
    selectedNewsIds: state.selectedNewsIds.includes(id)
      ? state.selectedNewsIds.filter((selectedId) => selectedId !== id)
      : [...state.selectedNewsIds, id],
  };
}

export function canSubmit(state: RoundState): boolean {
  if (!state.scenario || state.score) return false;
  return state.newsMode === "list" || state.newsDeckComplete;
}

function withVisible(state: RoundState): RoundState {
  const cutoff = cutoffFor(state);
  return {
    ...state,
    activeCutoff: cutoff,
    // Passing the scenario straight through when nothing is hidden keeps its
    // identity — a fresh filtered copy would reset the swipe deck.
    visibleScenario:
      state.scenario && cutoff
        ? visibleBeforeSubmit({ ...state.scenario, revealCutoffDate: cutoff })
        : state.scenario,
  };
}

/**
 * Reveal precedence, in order: a submitted round hides nothing, then
 * reveal-all, then a manual cutoff override, then the scenario's own
 * revealCutoffDate. Undefined means detective mode — everything visible.
 */
function cutoffFor({ scenario, settings, score }: RoundState): string | undefined {
  if (!scenario || score || settings.revealAll) return undefined;
  return settings.cutoffOverride || scenario.revealCutoffDate;
}

// Spreading over the defaults means an older stored blob transparently gains
// any field added later.
function mergeSettings(stored: unknown, defaultScenarioId: string): Settings {
  return {
    scenarioId: defaultScenarioId,
    revealAll: false,
    falsePositiveWeight: 1,
    cutoffOverride: "",
    debug: false,
    ...(typeof stored === "object" && stored !== null ? (stored as Partial<Settings>) : {}),
  };
}
