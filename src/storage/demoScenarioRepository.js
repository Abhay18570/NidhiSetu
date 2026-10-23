/**
 * NidhiSetu SIH Demonstration Scenario Repository
 * Tracks current active scenario, step-by-step progress, and demonstration session states.
 * Persists to STORAGE_KEYS.DEMO_SCENARIOS.
 */

import { storageService, STORAGE_KEYS } from './storageService';
import { DEMO_SCENARIOS } from '../commandCenter/commandCenterDemoFixtures';

export const demoScenarioRepository = {
  async getAllScenarios() {
    const list = storageService.getItem(STORAGE_KEYS.DEMO_SCENARIOS, null);
    if (!list || !Array.isArray(list) || list.length === 0) {
      storageService.setItem(STORAGE_KEYS.DEMO_SCENARIOS, DEMO_SCENARIOS);
      return DEMO_SCENARIOS;
    }
    return list;
  },

  async getScenarioById(scenarioId) {
    const scenarios = await this.getAllScenarios();
    return scenarios.find((s) => s.id === scenarioId || s.scenarioId === scenarioId) || null;
  },

  async updateScenarioProgress(scenarioId, currentStepIndex, completed = false) {
    const scenarios = await this.getAllScenarios();
    const idx = scenarios.findIndex((s) => s.id === scenarioId || s.scenarioId === scenarioId);
    if (idx < 0) return null;

    scenarios[idx] = {
      ...scenarios[idx],
      currentStep: currentStepIndex,
      isCompleted: completed,
      lastExecutedAt: new Date().toISOString(),
    };
    storageService.setItem(STORAGE_KEYS.DEMO_SCENARIOS, scenarios);
    return scenarios[idx];
  },

  async resetScenarios() {
    storageService.setItem(STORAGE_KEYS.DEMO_SCENARIOS, DEMO_SCENARIOS);
    return DEMO_SCENARIOS;
  },
};
