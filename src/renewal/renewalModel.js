/**
 * NidhiSetu Renewal & Deposit Continuity Data Model
 * Defines schemas, statuses, lifecycle state machines, and disclaimers.
 *
 * CRITICAL REGULATORY BOUNDARY:
 * Administrative clearance of a renewal or release request represents regulatory
 * administrative record acceptance ONLY. It NEVER represents an actual commercial
 * bank lien cancellation or fund transfer.
 */

export const RENEWAL_TYPES = {
  EXTENSION_OF_EXISTING_FDR: 'EXTENSION_OF_EXISTING_FDR',
  REPLACEMENT_FDR: 'REPLACEMENT_FDR',
  PARTIAL_REPLACEMENT: 'PARTIAL_REPLACEMENT',
  MULTIPLE_REPLACEMENT_FDRS: 'MULTIPLE_REPLACEMENT_FDRS',
};

export const RENEWAL_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  CLARIFICATION_REQUIRED: 'CLARIFICATION_REQUIRED',
  RESUBMITTED: 'RESUBMITTED',
  ACCEPTED_FOR_RECORD: 'ACCEPTED_FOR_RECORD',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
  SUPERSEDED: 'SUPERSEDED',
};

export const VALID_RENEWAL_TRANSITIONS = {
  [RENEWAL_STATUS.DRAFT]: [RENEWAL_STATUS.SUBMITTED, RENEWAL_STATUS.WITHDRAWN],
  [RENEWAL_STATUS.SUBMITTED]: [RENEWAL_STATUS.UNDER_REVIEW, RENEWAL_STATUS.WITHDRAWN],
  [RENEWAL_STATUS.UNDER_REVIEW]: [
    RENEWAL_STATUS.CLARIFICATION_REQUIRED,
    RENEWAL_STATUS.ACCEPTED_FOR_RECORD,
    RENEWAL_STATUS.REJECTED,
  ],
  [RENEWAL_STATUS.CLARIFICATION_REQUIRED]: [
    RENEWAL_STATUS.RESUBMITTED,
    RENEWAL_STATUS.WITHDRAWN,
  ],
  [RENEWAL_STATUS.RESUBMITTED]: [RENEWAL_STATUS.UNDER_REVIEW],
  [RENEWAL_STATUS.ACCEPTED_FOR_RECORD]: [RENEWAL_STATUS.SUPERSEDED],
  [RENEWAL_STATUS.REJECTED]: [RENEWAL_STATUS.DRAFT], // Allow restarting draft
  [RENEWAL_STATUS.WITHDRAWN]: [],
  [RENEWAL_STATUS.SUPERSEDED]: [],
};

export const RELEASE_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  CLARIFICATION_REQUIRED: 'CLARIFICATION_REQUIRED',
  ADMINISTRATIVELY_CLEARED: 'ADMINISTRATIVELY_CLEARED',
  DECLINED: 'DECLINED',
  WITHDRAWN: 'WITHDRAWN',
};

export const VALID_RELEASE_TRANSITIONS = {
  [RELEASE_STATUS.DRAFT]: [RELEASE_STATUS.SUBMITTED, RELEASE_STATUS.WITHDRAWN],
  [RELEASE_STATUS.SUBMITTED]: [RELEASE_STATUS.UNDER_REVIEW, RELEASE_STATUS.WITHDRAWN],
  [RELEASE_STATUS.UNDER_REVIEW]: [
    RELEASE_STATUS.CLARIFICATION_REQUIRED,
    RELEASE_STATUS.ADMINISTRATIVELY_CLEARED,
    RELEASE_STATUS.DECLINED,
  ],
  [RELEASE_STATUS.CLARIFICATION_REQUIRED]: [
    RELEASE_STATUS.UNDER_REVIEW,
    RELEASE_STATUS.WITHDRAWN,
  ],
  [RELEASE_STATUS.ADMINISTRATIVELY_CLEARED]: [],
  [RELEASE_STATUS.DECLINED]: [RELEASE_STATUS.DRAFT],
  [RELEASE_STATUS.WITHDRAWN]: [],
};

export const CONTINUITY_STATUS = {
  CONTINUOUS_DECLARED_COVERAGE: 'CONTINUOUS_DECLARED_COVERAGE',
  PARTIAL_DECLARED_COVERAGE: 'PARTIAL_DECLARED_COVERAGE',
  COVERAGE_GAP: 'COVERAGE_GAP',
  INDETERMINATE: 'INDETERMINATE',
  REQUIREMENT_NOT_CONFIGURED: 'REQUIREMENT_NOT_CONFIGURED',
};

export const ESCALATION_LEVELS = {
  INFORMATIONAL: 'INFORMATIONAL',
  ATTENTION_REQUIRED: 'ATTENTION_REQUIRED',
  HIGH_PRIORITY: 'HIGH_PRIORITY',
  URGENT: 'URGENT',
};

export const RENEWAL_PROTOTYPE_DISCLAIMER =
  'Prototype Renewal & Deposit Continuity Assessment — Not an Official Regulatory or Banking Determination.';

export const ADMIN_RELEASE_DISCLAIMER =
  'Administrative Clearance Does Not Release Any Actual Bank Lien — No Real Banking Operations Performed.';

/**
 * Validates a renewal request object before submission.
 */
export function validateRenewalRequest(request) {
  const errors = [];

  if (!request) {
    return { valid: false, errors: ['Renewal request payload is required.'] };
  }

  if (!request.institutionId) {
    errors.push('institutionId is required.');
  }

  if (!request.originalFdrId) {
    errors.push('originalFdrId is required.');
  }

  if (!request.renewalType || !Object.values(RENEWAL_TYPES).includes(request.renewalType)) {
    errors.push(`Valid renewalType is required (${Object.values(RENEWAL_TYPES).join(', ')}).`);
  }

  // Validate replacement FDR references
  if (request.renewalType !== RENEWAL_TYPES.EXTENSION_OF_EXISTING_FDR) {
    if (!Array.isArray(request.replacementFdrIds) || request.replacementFdrIds.length === 0) {
      errors.push('At least one replacement FDR identifier must be provided for replacement renewals.');
    }
    // Prevent an FDR from being its own replacement
    if (request.replacementFdrIds && request.replacementFdrIds.includes(request.originalFdrId)) {
      errors.push('An FDR cannot be configured as its own replacement certificate.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
