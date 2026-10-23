/**
 * NidhiSetu Audit Repository
 * Records structured prototype events for compliance tracking.
 * Note: Browser localStorage logs are client-side simulations and not tamper-resistant.
 */

import { storageService, STORAGE_KEYS } from './storageService';

export const auditRepository = {
  async getAuditLogs() {
    const logs = storageService.getItem(STORAGE_KEYS.AUDIT_LOGS, []);
    if (!Array.isArray(logs)) return [];
    // Sort descending by timestamp
    return [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  async getAllEvents() {
    return this.getAuditLogs();
  },

  async logEvent({
    eventType,
    actorId = 'anonymous',
    actorRole = 'guest',
    targetEntityId = 'unknown',
    summary,
    metadata = {},
  }) {
    const logs = storageService.getItem(STORAGE_KEYS.AUDIT_LOGS, []);
    const safeLogs = Array.isArray(logs) ? logs : [];

    const newEvent = {
      id: `aud-${crypto.randomUUID().slice(0, 8)}`,
      eventType,
      actorId,
      actorRole,
      targetEntityId,
      summary: summary || `Event ${eventType} recorded`,
      timestamp: new Date().toISOString(),
      metadata,
    };

    // Prepend new event and keep last 200 logs
    const updatedLogs = [newEvent, ...safeLogs].slice(0, 200);
    storageService.setItem(STORAGE_KEYS.AUDIT_LOGS, updatedLogs);
    return newEvent;
  },

  async clearAuditLogs() {
    storageService.setItem(STORAGE_KEYS.AUDIT_LOGS, []);
    return true;
  },
};
