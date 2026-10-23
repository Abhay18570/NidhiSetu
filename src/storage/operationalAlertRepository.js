/**
 * NidhiSetu Operational Alert Repository
 * Manages platform-wide system alerts, dismissal audits, and acknowledgment states.
 * Persists to STORAGE_KEYS.OPERATIONAL_ALERTS.
 */

import { storageService, STORAGE_KEYS } from './storageService';
import { ALERT_STATUS, ALERT_SEVERITY } from '../commandCenter/commandCenterModel';

export const operationalAlertRepository = {
  async getAllAlerts() {
    const list = storageService.getItem(STORAGE_KEYS.OPERATIONAL_ALERTS, []);
    return Array.isArray(list) ? list : [];
  },

  async getActiveAlerts() {
    const list = await this.getAllAlerts();
    return list.filter((a) => a.status === ALERT_STATUS.ACTIVE);
  },

  async getAlertById(alertId) {
    const list = await this.getAllAlerts();
    return list.find((a) => a.id === alertId) || null;
  },

  /**
   * Upserts alerts based on their deterministic fingerprint to prevent duplicate spam.
   */
  async upsertAlerts(newAlerts) {
    const list = await this.getAllAlerts();
    const map = new Map(list.map((a) => [a.fingerprint, a]));

    newAlerts.forEach((na) => {
      if (map.has(na.fingerprint)) {
        const existing = map.get(na.fingerprint);
        // Do not reactivate dismissed or resolved alerts automatically
        if (existing.status !== ALERT_STATUS.DISMISSED && existing.status !== ALERT_STATUS.RESOLVED) {
          map.set(na.fingerprint, {
            ...existing,
            ...na,
            id: existing.id,
            status: existing.status, // preserve acknowledged state
            lastSeenAt: new Date().toISOString(),
          });
        }
      } else {
        map.set(na.fingerprint, {
          id: na.id || `ALT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          status: ALERT_STATUS.ACTIVE,
          createdAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          ...na,
        });
      }
    });

    const updatedList = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    storageService.setItem(STORAGE_KEYS.OPERATIONAL_ALERTS, updatedList);
    return updatedList;
  },

  async acknowledgeAlert(alertId, acknowledgedBy) {
    const list = await this.getAllAlerts();
    const idx = list.findIndex((a) => a.id === alertId);
    if (idx < 0) return null;

    list[idx] = {
      ...list[idx],
      status: ALERT_STATUS.ACKNOWLEDGED,
      acknowledgedBy,
      acknowledgedAt: new Date().toISOString(),
    };
    storageService.setItem(STORAGE_KEYS.OPERATIONAL_ALERTS, list);
    return list[idx];
  },

  /**
   * Dismisses an alert. If severity is HIGH or CRITICAL, dismissalReason is strictly mandatory.
   */
  async dismissAlert(alertId, dismissedBy, dismissalReason) {
    const list = await this.getAllAlerts();
    const idx = list.findIndex((a) => a.id === alertId);
    if (idx < 0) return null;

    const alert = list[idx];
    if (
      (alert.severity === ALERT_SEVERITY.HIGH || alert.severity === ALERT_SEVERITY.CRITICAL) &&
      (!dismissalReason || dismissalReason.trim().length < 5)
    ) {
      throw new Error('Mandatory audit justification required to dismiss HIGH or CRITICAL operational alerts.');
    }

    list[idx] = {
      ...alert,
      status: ALERT_STATUS.DISMISSED,
      dismissedBy,
      dismissalReason: dismissalReason || 'Dismissed by operational officer',
      dismissedAt: new Date().toISOString(),
    };
    storageService.setItem(STORAGE_KEYS.OPERATIONAL_ALERTS, list);
    return list[idx];
  },

  async resolveAlert(alertId, resolvedBy, resolutionNotes) {
    const list = await this.getAllAlerts();
    const idx = list.findIndex((a) => a.id === alertId);
    if (idx < 0) return null;

    list[idx] = {
      ...list[idx],
      status: ALERT_STATUS.RESOLVED,
      resolvedBy,
      resolutionNotes: resolutionNotes || 'Resolved through standard administrative workflow',
      resolvedAt: new Date().toISOString(),
    };
    storageService.setItem(STORAGE_KEYS.OPERATIONAL_ALERTS, list);
    return list[idx];
  },
};
