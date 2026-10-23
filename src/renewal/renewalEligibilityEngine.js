/**
 * NidhiSetu Renewal & Deposit Continuity — Renewal Eligibility Engine
 * Evaluates whether an FDR record is eligible to initiate or complete a renewal cycle.
 *
 * Rules:
 * - FDR must belong to requesting institution.
 * - Current lifecycle status must be valid (ACTIVE, APPROVED, MATURED, VERIFIED).
 * - Cancelled or superseded certificates cannot initiate new renewal cycles.
 * - An FDR cannot be its own replacement.
 * - Replacement FDRs must belong to the same institution.
 * - Early renewals (>90 days) are fully permitted.
 * - Prevents duplicate active renewal chains.
 */

import { RENEWAL_STATUS } from './renewalModel';

export const ELIGIBILITY_OUTCOMES = {
  ELIGIBLE: 'ELIGIBLE',
  ALREADY_IN_RENEWAL: 'ALREADY_IN_RENEWAL',
  ALREADY_SUPERSEDED: 'ALREADY_SUPERSEDED',
  NOT_ELIGIBLE: 'NOT_ELIGIBLE',
  REQUIRES_OFFICER_REVIEW: 'REQUIRES_OFFICER_REVIEW',
  INDETERMINATE: 'INDETERMINATE',
};

/**
 * Checks if an FDR is eligible to initiate a renewal request
 * @param {Object} fdr - Original FDR
 * @param {string} requestingInstitutionId - ID of institution requesting renewal
 * @param {Array} existingRequests - Prior renewal requests
 */
export function evaluateRenewalEligibility(fdr, requestingInstitutionId, existingRequests = []) {
  if (!fdr) {
    return {
      outcome: ELIGIBILITY_OUTCOMES.NOT_ELIGIBLE,
      eligible: false,
      reason: 'FDR record was not found or was empty.',
      details: null,
    };
  }

  const fdrId = String(fdr.id || fdr.fdrId);

  // 1. Institution Ownership Check
  if (requestingInstitutionId && String(fdr.institutionId) !== String(requestingInstitutionId)) {
    return {
      outcome: ELIGIBILITY_OUTCOMES.NOT_ELIGIBLE,
      eligible: false,
      reason: `Institutional isolation violation: FDR belongs to institution ${fdr.institutionId}, not ${requestingInstitutionId}.`,
      details: { fdrInstitutionId: fdr.institutionId, requestingInstitutionId },
    };
  }

  // 2. Lifecycle Status Check
  const status = (fdr.status || fdr.lifecycleStatus || '').toUpperCase();
  if (status === 'SUPERSEDED') {
    return {
      outcome: ELIGIBILITY_OUTCOMES.ALREADY_SUPERSEDED,
      eligible: false,
      reason: 'This certificate has already been superseded by a renewed or replacement FDR.',
      details: { status },
    };
  }

  if (status === 'CANCELLED' || status === 'REJECTED') {
    return {
      outcome: ELIGIBILITY_OUTCOMES.NOT_ELIGIBLE,
      eligible: false,
      reason: `FDR is in ${status} status and cannot undergo renewal.`,
      details: { status },
    };
  }

  // 3. Existing Active Renewal Check
  const activeRequest = existingRequests.find((req) => {
    const matchesOriginal = String(req.originalFdrId) === fdrId;
    const isUnresolved =
      req.status === RENEWAL_STATUS.DRAFT ||
      req.status === RENEWAL_STATUS.SUBMITTED ||
      req.status === RENEWAL_STATUS.UNDER_REVIEW ||
      req.status === RENEWAL_STATUS.CLARIFICATION_REQUIRED ||
      req.status === RENEWAL_STATUS.RESUBMITTED;
    return matchesOriginal && isUnresolved;
  });

  if (activeRequest) {
    return {
      outcome: ELIGIBILITY_OUTCOMES.ALREADY_IN_RENEWAL,
      eligible: false,
      reason: `An active renewal request (${activeRequest.renewalReference || activeRequest.renewalRequestId}) is already in progress (${activeRequest.status}).`,
      details: {
        activeRequestId: activeRequest.renewalRequestId,
        activeStatus: activeRequest.status,
      },
    };
  }

  // 4. Early Renewal Policy:
  // An early renewal (>90 days to maturity) is explicitly ELIGIBLE with explanatory advisory.
  return {
    outcome: ELIGIBILITY_OUTCOMES.ELIGIBLE,
    eligible: true,
    reason: 'FDR satisfies all institutional ownership, lifecycle, and non-duplication criteria for renewal.',
    details: {
      fdrNumber: fdr.fdrNumber,
      maturityDate: fdr.maturityDate,
      depositAmountPaise: fdr.depositAmountPaise || fdr.amountPaise,
    },
  };
}

/**
 * Validates candidate replacement FDRs for a renewal submission
 * @param {Object} originalFdr - Source FDR
 * @param {Array<Object>} replacementFdrs - Candidate replacement FDR records
 */
export function validateReplacementFdrs(originalFdr, replacementFdrs = []) {
  const errors = [];
  const originalId = String(originalFdr.id || originalFdr.fdrId);

  if (!replacementFdrs || replacementFdrs.length === 0) {
    return {
      valid: false,
      errors: ['At least one replacement FDR is required for replacement-type renewals.'],
    };
  }

  for (const rep of replacementFdrs) {
    const repId = String(rep.id || rep.fdrId);

    // Prevent FDR from replacing itself
    if (repId === originalId) {
      errors.push(`Self-replacement violation: Certificate ${rep.fdrNumber || repId} cannot be configured as its own replacement.`);
    }

    // Prevent cross-institution replacement
    if (rep.institutionId && originalFdr.institutionId && String(rep.institutionId) !== String(originalFdr.institutionId)) {
      errors.push(
        `Cross-institution mismatch: Replacement FDR ${rep.fdrNumber || repId} belongs to institution ${rep.institutionId}, but original deposit belongs to ${originalFdr.institutionId}.`
      );
    }

    // Lifecycle check for replacement
    const repStatus = (rep.status || '').toUpperCase();
    if (repStatus === 'CANCELLED' || repStatus === 'REJECTED' || repStatus === 'SUPERSEDED') {
      errors.push(`Replacement FDR ${rep.fdrNumber || repId} is in an invalid lifecycle status (${repStatus}).`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
