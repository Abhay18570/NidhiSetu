/**
 * NidhiSetu Renewal & Deposit Continuity — Renewal Workflow Engine
 * Enforces strict deterministic state machine transitions, mandatory officer reasons,
 * and role-based actions for renewal and administrative release lifecycles.
 */

import {
  RENEWAL_STATUS,
  VALID_RENEWAL_TRANSITIONS,
  RELEASE_STATUS,
  VALID_RELEASE_TRANSITIONS,
} from './renewalModel';

/**
 * Validates a proposed state transition for a renewal request
 */
export function validateRenewalTransition(currentStatus, targetStatus, role = 'officer', reason = '') {
  const allowed = VALID_RENEWAL_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(targetStatus)) {
    return {
      valid: false,
      error: `Invalid lifecycle transition from ${currentStatus} to ${targetStatus}. Allowed target states: ${allowed.join(', ') || 'None'}.`,
    };
  }

  // Officer-only transitions
  const officerTargetStates = [
    RENEWAL_STATUS.UNDER_REVIEW,
    RENEWAL_STATUS.CLARIFICATION_REQUIRED,
    RENEWAL_STATUS.ACCEPTED_FOR_RECORD,
    RENEWAL_STATUS.REJECTED,
  ];

  if (officerTargetStates.includes(targetStatus) && role !== 'officer' && role !== 'admin') {
    return {
      valid: false,
      error: `Unauthorized: Transition to ${targetStatus} requires officer or administrator credentials.`,
    };
  }

  // Mandatory substantive reason for scrutiny decisions
  const requiresReasonStates = [
    RENEWAL_STATUS.CLARIFICATION_REQUIRED,
    RENEWAL_STATUS.REJECTED,
  ];

  if (requiresReasonStates.includes(targetStatus)) {
    if (!reason || reason.trim().length < 5) {
      return {
        valid: false,
        error: `Mandatory substantive justification (minimum 5 characters) is required when transitioning to ${targetStatus}.`,
      };
    }
  }

  return { valid: true, error: null };
}

/**
 * Validates a proposed state transition for an administrative release request
 */
export function validateReleaseTransition(currentStatus, targetStatus, role = 'officer', reason = '') {
  const allowed = VALID_RELEASE_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(targetStatus)) {
    return {
      valid: false,
      error: `Invalid release transition from ${currentStatus} to ${targetStatus}. Allowed states: ${allowed.join(', ') || 'None'}.`,
    };
  }

  if (
    (targetStatus === RELEASE_STATUS.ADMINISTRATIVELY_CLEARED ||
      targetStatus === RELEASE_STATUS.DECLINED ||
      targetStatus === RELEASE_STATUS.UNDER_REVIEW) &&
    role !== 'officer' &&
    role !== 'admin'
  ) {
    return {
      valid: false,
      error: `Unauthorized: Adjudicating administrative release requests requires officer permissions.`,
    };
  }

  // Mandatory reason for clearance or decline
  if (targetStatus === RELEASE_STATUS.ADMINISTRATIVELY_CLEARED || targetStatus === RELEASE_STATUS.DECLINED) {
    if (!reason || reason.trim().length < 5) {
      return {
        valid: false,
        error: `Mandatory rationale (minimum 5 characters) required for ${targetStatus}.`,
      };
    }
  }

  return { valid: true, error: null };
}
