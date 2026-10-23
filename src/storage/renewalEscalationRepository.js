/**
 * NidhiSetu Storage — Renewal Escalation Repository
 * Tracks high-priority renewal escalations, review backlogs, and resolution workflows.
 */

import { storageService, STORAGE_KEYS } from './storageService';
import { auditRepository } from './auditRepository';

export const renewalEscalationRepository = {
  /**
   * Retrieves all renewal escalations
   */
  async getAllEscalations() {
    const list = storageService.getItem(STORAGE_KEYS.RENEWAL_ESCALATIONS, []);
    return Array.isArray(list) ? list : [];
  },

  /**
   * Retrieves escalations for an institution
   */
  async getEscalationsByInstitutionId(institutionId) {
    if (!institutionId) return [];
    const all = await this.getAllEscalations();
    return all.filter((e) => String(e.institutionId) === String(institutionId));
  },

  /**
   * Acknowledges an escalation
   */
  async acknowledgeEscalation(escalationId, actorId = 'officer-user') {
    const all = await this.getAllEscalations();
    const index = all.findIndex((e) => e.escalationId === escalationId);
    if (index === -1) throw new Error('Escalation not found.');

    const current = all[index];
    const updated = {
      ...current,
      status: 'ACKNOWLEDGED',
      acknowledgedBy: actorId,
      acknowledgedAt: new Date().toISOString(),
    };

    all[index] = updated;
    storageService.setItem(STORAGE_KEYS.RENEWAL_ESCALATIONS, all);

    await auditRepository.logEvent({
      eventType: 'RENEWAL_ESCALATION_ACKNOWLEDGED',
      actorId,
      actorRole: 'officer',
      targetEntityId: escalationId,
      summary: `Acknowledged renewal escalation: ${current.reason}`,
    });

    return updated;
  },

  /**
   * Resolves an escalation
   */
  async resolveEscalation(escalationId, actorId = 'officer-user', notes = '') {
    const all = await this.getAllEscalations();
    const index = all.findIndex((e) => e.escalationId === escalationId);
    if (index === -1) throw new Error('Escalation not found.');

    const current = all[index];
    const updated = {
      ...current,
      status: 'RESOLVED',
      resolvedBy: actorId,
      resolvedAt: new Date().toISOString(),
      resolutionNotes: notes,
    };

    all[index] = updated;
    storageService.setItem(STORAGE_KEYS.RENEWAL_ESCALATIONS, all);

    await auditRepository.logEvent({
      eventType: 'RENEWAL_ESCALATION_RESOLVED',
      actorId,
      actorRole: 'officer',
      targetEntityId: escalationId,
      summary: `Resolved renewal escalation: ${notes || current.reason}`,
    });

    return updated;
  },

  /**
   * Idempotently merges newly calculated escalations into storage
   */
  async syncEscalations(computedEscalations = []) {
    const existing = await this.getAllEscalations();
    const existingMap = new Map(existing.map((e) => [e.escalationId, e]));

    for (const comp of computedEscalations) {
      if (!existingMap.has(comp.escalationId)) {
        existingMap.set(comp.escalationId, comp);
      }
    }

    const merged = Array.from(existingMap.values());
    storageService.setItem(STORAGE_KEYS.RENEWAL_ESCALATIONS, merged);
    return merged;
  },
};
