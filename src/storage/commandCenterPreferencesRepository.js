/**
 * NidhiSetu Command Center Preferences Repository
 * Persists user-tailored dashboard layout, visible modules, and density preferences.
 * Persists to STORAGE_KEYS.COMMAND_CENTER_PREFS.
 */

import { storageService, STORAGE_KEYS } from './storageService';
import { DEFAULT_COMMAND_CENTER_PREFERENCES } from '../commandCenter/commandCenterModel';

export const commandCenterPreferencesRepository = {
  async getPreferences(userId) {
    if (!userId) return { ...DEFAULT_COMMAND_CENTER_PREFERENCES };
    const allPrefs = storageService.getItem(STORAGE_KEYS.COMMAND_CENTER_PREFS, {});
    return allPrefs[userId] ? { ...DEFAULT_COMMAND_CENTER_PREFERENCES, ...allPrefs[userId] } : { ...DEFAULT_COMMAND_CENTER_PREFERENCES };
  },

  async savePreferences(userId, prefs) {
    if (!userId) return false;
    const allPrefs = storageService.getItem(STORAGE_KEYS.COMMAND_CENTER_PREFS, {});
    allPrefs[userId] = {
      ...(allPrefs[userId] || DEFAULT_COMMAND_CENTER_PREFERENCES),
      ...prefs,
      updatedAt: new Date().toISOString(),
    };
    storageService.setItem(STORAGE_KEYS.COMMAND_CENTER_PREFS, allPrefs);
    return allPrefs[userId];
  },

  async resetPreferences(userId) {
    if (!userId) return { ...DEFAULT_COMMAND_CENTER_PREFERENCES };
    const allPrefs = storageService.getItem(STORAGE_KEYS.COMMAND_CENTER_PREFS, {});
    delete allPrefs[userId];
    storageService.setItem(STORAGE_KEYS.COMMAND_CENTER_PREFS, allPrefs);
    return { ...DEFAULT_COMMAND_CENTER_PREFERENCES };
  },
};
