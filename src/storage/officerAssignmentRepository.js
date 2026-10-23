/**
 * NidhiSetu Officer Assignment Repository
 * Manages task assignments and historical reassignments across Modules 03–07.
 * Persists to STORAGE_KEYS.OFFICER_ASSIGNMENTS.
 */

import { storageService, STORAGE_KEYS } from './storageService';
import { auditRepository } from './auditRepository';

export const officerAssignmentRepository = {
  async getAllAssignments() {
    const list = storageService.getItem(STORAGE_KEYS.OFFICER_ASSIGNMENTS, []);
    return Array.isArray(list) ? list : [];
  },

  async getAssignmentByActionId(actionId) {
    const list = await this.getAllAssignments();
    return list.find((a) => a.actionId === actionId) || null;
  },

  async getAssignmentsByOfficer(officerId) {
    const list = await this.getAllAssignments();
    return list.filter((a) => a.assignedTo === officerId);
  },

  /**
   * Assigns or reassigns a task to an officer.
   * Maintains immutable assignment history.
   */
  async assignTask({
    actionId,
    sourceModule,
    sourceEntityId,
    institutionId,
    assignedTo,
    assignedBy,
    reason = 'Standard operational assignment',
    previousAssignee = null,
  }) {
    const list = await this.getAllAssignments();
    const now = new Date().toISOString();
    const existingIndex = list.findIndex((a) => a.actionId === actionId);

    const historyEntry = {
      assignedTo,
      assignedBy,
      assignedAt: now,
      reason,
      previousAssignee,
    };

    let updatedAssignment;
    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      updatedAssignment = {
        ...existing,
        assignedTo,
        assignedBy,
        assignedAt: now,
        reason,
        previousAssignee: existing.assignedTo || previousAssignee,
        history: [...(existing.history || []), historyEntry],
      };
      list[existingIndex] = updatedAssignment;
    } else {
      updatedAssignment = {
        id: `ASSIGN-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        actionId,
        sourceModule,
        sourceEntityId,
        institutionId,
        assignedTo,
        assignedBy,
        assignedAt: now,
        reason,
        previousAssignee,
        history: [historyEntry],
      };
      list.push(updatedAssignment);
    }

    storageService.setItem(STORAGE_KEYS.OFFICER_ASSIGNMENTS, list);

    // Audit log
    await auditRepository.logEvent({
      action: 'OFFICER_TASK_ASSIGNED',
      performedBy: assignedBy,
      role: 'officer',
      entityId: actionId,
      entityType: 'COMMAND_CENTER_ACTION',
      details: {
        assignedTo,
        previousAssignee,
        reason,
        sourceModule,
        sourceEntityId,
      },
    });

    return updatedAssignment;
  },

  async getAssignmentHistory(actionId) {
    const assignment = await this.getAssignmentByActionId(actionId);
    return assignment ? assignment.history || [] : [];
  },
};
