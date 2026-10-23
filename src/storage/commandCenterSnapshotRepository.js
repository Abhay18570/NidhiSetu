/**
 * NidhiSetu Command Center Snapshot Repository
 * Caches derived portfolio aggregation snapshots to optimize repeat views without recomputing.
 * Automatically invalidated upon fingerprint mismatch.
 */

import { storageService, STORAGE_KEYS } from './storageService';

export const commandCenterSnapshotRepository = {
  async getLatestSnapshot(scope = 'GLOBAL') {
    const snapshots = storageService.getItem(STORAGE_KEYS.COMMAND_CENTER_SNAPSHOTS, {});
    return snapshots[scope] || null;
  },

  async saveSnapshot(scope, snapshotData, fingerprint) {
    const snapshots = storageService.getItem(STORAGE_KEYS.COMMAND_CENTER_SNAPSHOTS, {});
    snapshots[scope] = {
      ...snapshotData,
      fingerprint,
      cachedAt: new Date().toISOString(),
    };
    storageService.setItem(STORAGE_KEYS.COMMAND_CENTER_SNAPSHOTS, snapshots);
    return snapshots[scope];
  },

  async clearSnapshot(scope = null) {
    if (scope) {
      const snapshots = storageService.getItem(STORAGE_KEYS.COMMAND_CENTER_SNAPSHOTS, {});
      delete snapshots[scope];
      storageService.setItem(STORAGE_KEYS.COMMAND_CENTER_SNAPSHOTS, snapshots);
    } else {
      storageService.setItem(STORAGE_KEYS.COMMAND_CENTER_SNAPSHOTS, {});
    }
  },
};
