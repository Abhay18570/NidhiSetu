/**
 * NidhiSetu Command Center — SIH Demonstration Scenario Orchestrator
 * Coordinates guided demonstration walkthroughs for hackathon judges and evaluators.
 *
 * CRITICAL REQUIREMENTS:
 * - Deterministic, step-by-step guidance across all 8 modules.
 * - Non-destructive: Never overwrites real user-created records.
 * - Explicit reset controls restore synthetic baseline states cleanly.
 */

import { demoScenarioRepository } from '../storage/demoScenarioRepository';

export const demoScenarioOrchestrator = {
  async getScenarios() {
    return await demoScenarioRepository.getAllScenarios();
  },

  async getScenario(scenarioId) {
    return await demoScenarioRepository.getScenarioById(scenarioId);
  },

  async advanceScenarioStep(scenarioId, currentStep) {
    const scenario = await demoScenarioRepository.getScenarioById(scenarioId);
    if (!scenario) return null;

    const totalSteps = (scenario.guidedSteps || []).length;
    const nextStep = currentStep + 1;
    const isCompleted = nextStep >= totalSteps;

    return await demoScenarioRepository.updateScenarioProgress(
      scenarioId,
      Math.min(nextStep, totalSteps),
      isCompleted
    );
  },

  async resetScenario(scenarioId) {
    return await demoScenarioRepository.updateScenarioProgress(scenarioId, 0, false);
  },

  async resetAllScenarios() {
    return await demoScenarioRepository.resetScenarios();
  },
};
