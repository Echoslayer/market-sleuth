import type { Scenario } from "../types/scenario";

export type ScenarioDataProvider = {
  getScenario(id: string): Promise<Scenario>;
};

/** Fetches a scenario JSON file served from `frontend/public/data/`. */
export const localJsonScenarioDataProvider: ScenarioDataProvider = {
  getScenario: async (id) => {
    const response = await fetch(`/data/${id}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load scenario "${id}": ${response.status}`);
    }
    return (await response.json()) as Scenario;
  },
};
