/**
 * NidhiSetu FDR Lifecycle Engine
 * Implements a deterministic state machine, validation rules, role boundaries,
 * and immutable event logging for institutional security deposit records.
 */

import { storageService, STORAGE_KEYS } from './storageService';

export const FDR_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  CLARIFICATION_REQUIRED: 'CLARIFICATION_REQUIRED',
  RESUBMITTED: 'RESUBMITTED',
  REVIEW_ACCEPTED: 'REVIEW_ACCEPTED',
  REVIEW_REJECTED: 'REVIEW_REJECTED',
};

// Valid transitions mapping
export const ALLOWED_TRANSITIONS = {
  [FDR_STATUS.DRAFT]: [FDR_STATUS.SUBMITTED],
  [FDR_STATUS.SUBMITTED]: [FDR_STATUS.UNDER_REVIEW],
  [FDR_STATUS.UNDER_REVIEW]: [
    FDR_STATUS.CLARIFICATION_REQUIRED,
    FDR_STATUS.REVIEW_ACCEPTED,
    FDR_STATUS.REVIEW_REJECTED,
  ],
  [FDR_STATUS.CLARIFICATION_REQUIRED]: [FDR_STATUS.RESUBMITTED],
  [FDR_STATUS.RESUBMITTED]: [FDR_STATUS.UNDER_REVIEW],
  [FDR_STATUS.REVIEW_ACCEPTED]: [], // Terminal state for submission review
  [FDR_STATUS.REVIEW_REJECTED]: [], // Terminal state for submission review
};

// Role permissions mapping
export const ROLE_TRANSITION_PERMISSIONS = {
  institution: [
    { from: FDR_STATUS.DRAFT, to: FDR_STATUS.SUBMITTED },
    { from: FDR_STATUS.CLARIFICATION_REQUIRED, to: FDR_STATUS.RESUBMITTED },
  ],
  officer: [
    { from: FDR_STATUS.SUBMITTED, to: FDR_STATUS.UNDER_REVIEW },
    { from: FDR_STATUS.RESUBMITTED, to: FDR_STATUS.UNDER_REVIEW },
    { from: FDR_STATUS.UNDER_REVIEW, to: FDR_STATUS.CLARIFICATION_REQUIRED },
    { from: FDR_STATUS.UNDER_REVIEW, to: FDR_STATUS.REVIEW_ACCEPTED },
    { from: FDR_STATUS.UNDER_REVIEW, to: FDR_STATUS.REVIEW_REJECTED },
  ],
  admin: [
    // Administrators can perform officer review transitions in prototype mode
    { from: FDR_STATUS.SUBMITTED, to: FDR_STATUS.UNDER_REVIEW },
    { from: FDR_STATUS.RESUBMITTED, to: FDR_STATUS.UNDER_REVIEW },
    { from: FDR_STATUS.UNDER_REVIEW, to: FDR_STATUS.CLARIFICATION_REQUIRED },
    { from: FDR_STATUS.UNDER_REVIEW, to: FDR_STATUS.REVIEW_ACCEPTED },
    { from: FDR_STATUS.UNDER_REVIEW, to: FDR_STATUS.REVIEW_REJECTED },
  ],
};

export const fdrLifecycleRepository = {
  /**
   * Validates if a lifecycle transition is permitted
   */
  validateTransition(currentStatus, targetStatus, role = 'institution') {
    if (!currentStatus || !targetStatus) {
      return { valid: false, error: 'Both current and target lifecycle statuses must be specified.' };
    }

    const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(targetStatus)) {
      return {
        valid: false,
        error: `Invalid lifecycle transition from "${currentStatus}" to "${targetStatus}".`,
      };
    }

    // Role check
    const permittedPairs = ROLE_TRANSITION_PERMISSIONS[role] || [];
    const isRoleAuthorized = permittedPairs.some(
      (p) => p.from === currentStatus && p.to === targetStatus
    );

    if (!isRoleAuthorized) {
      return {
        valid: false,
        error: `Unauthorized: Role "${role}" is not permitted to transition records from "${currentStatus}" to "${targetStatus}".`,
      };
    }

    return { valid: true, error: null };
  },

  /**
   * Retrieves all lifecycle events from storage
   */
  async getAllEvents() {
    const list = storageService.getItem(STORAGE_KEYS.FDR_EVENTS, []);
    return Array.isArray(list) ? list : [];
  },

  /**
   * Retrieves timeline history of lifecycle events for a specific FDR
   */
  async getEventsForFdr(fdrId) {
    if (!fdrId) return [];
    const all = await this.getAllEvents();
    return all
      .filter((ev) => ev.fdrId === fdrId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  async getEventsForFDR(fdrId) {
    return this.getEventsForFdr(fdrId);
  },

  /**
   * Records a transition event and appends it to immutable event storage
   */
  async recordTransition(fdrId, targetStatus, {
    actorId = 'anonymous',
    actorRole = 'system',
    actorName = 'System',
    previousStatus = null,
    reason = '',
    notes = '',
    snapshot = null,
  }) {
    if (!fdrId) throw new Error('fdrId is required to record transition.');

    // Reasons are mandatory for clarifications and rejections
    if (targetStatus === FDR_STATUS.CLARIFICATION_REQUIRED && (!reason || !reason.trim())) {
      throw new Error('A specific clarification reason is mandatory when requesting institution updates.');
    }

    if (targetStatus === FDR_STATUS.REVIEW_REJECTED && (!reason || !reason.trim())) {
      throw new Error('A specific rejection reason is mandatory when rejecting an FDR submission.');
    }

    const eventRecord = {
      id: `fev-${crypto.randomUUID().slice(0, 8)}`,
      fdrId,
      previousStatus,
      newStatus: targetStatus,
      actorId,
      actorRole,
      actorName,
      reason: reason ? reason.trim() : null,
      notes: notes ? notes.trim() : null,
      timestamp: new Date().toISOString(),
      snapshot: snapshot || null,
    };

    const allEvents = await this.getAllEvents();
    const updated = [eventRecord, ...allEvents].slice(0, 500); // Cap event log size safely
    storageService.setItem(STORAGE_KEYS.FDR_EVENTS, updated);

    return eventRecord;
  },
};
