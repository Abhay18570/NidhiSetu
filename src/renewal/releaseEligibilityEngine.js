/**
 * NidhiSetu Renewal & Deposit Continuity — Release Eligibility Engine
 * Evaluates whether an FDR certificate is eligible for administrative clearance review.
 *
 * CRITICAL REGULATORY BOUNDARY:
 * Administrative clearance of a superseded FDR record indicates that the regulatory
 * authority no longer requires administrative retention of that specific certificate.
 * IT NEVER PERFORMS OR IMPLIES AN ACTUAL COMMERCIAL BANK LIEN DISCHARGE.
 */

import { complianceCaseRepository } from '../storage/complianceCaseRepository';
import { RENEWAL_STATUS } from './renewalModel';

export const RELEASE_ELIGIBILITY_OUTCOMES = {
  ELIGIBLE_FOR_ADMINISTRATIVE_REVIEW: 'ELIGIBLE_FOR_ADMINISTRATIVE_REVIEW',
  REQUIRES_ADDITIONAL_EVIDENCE: 'REQUIRES_ADDITIONAL_EVIDENCE',
  POTENTIAL_COVERAGE_SHORTFALL: 'POTENTIAL_COVERAGE_SHORTFALL',
  BLOCKED_BY_OPEN_CASE: 'BLOCKED_BY_OPEN_CASE',
  INDETERMINATE: 'INDETERMINATE',
};

/**
 * Assesses an FDR's eligibility for administrative clearance submission.
 *
 * @param {Object} originalFdr - Source FDR
 * @param {Object} renewalRequest - Associated accepted renewal request (if applicable)
 * @param {Array<Object>} replacementFdrs - Linked replacement deposits
 * @param {string} releaseReason - Reason stated by institution
 */
export async function evaluateReleaseEligibility({
  originalFdr,
  renewalRequest = null,
  replacementFdrs = [],
  releaseReason = '',
}) {
  if (!originalFdr) {
    return {
      outcome: RELEASE_ELIGIBILITY_OUTCOMES.INDETERMINATE,
      eligible: false,
      reason: 'Original FDR record is missing or invalid.',
    };
  }

  const fdrId = String(originalFdr.id || originalFdr.fdrId);
  const institutionId = originalFdr.institutionId;

  // 1. Check for open compliance cases on this institution/FDR
  const openCases = await complianceCaseRepository.getCasesByInstitutionId(institutionId);
  const blockingCases = openCases.filter(
    (c) => c.status === 'OPEN' || c.status === 'UNDER_REVIEW' || c.status === 'FOLLOW_UP_REQUESTED'
  );

  if (blockingCases.length > 0) {
    return {
      outcome: RELEASE_ELIGIBILITY_OUTCOMES.BLOCKED_BY_OPEN_CASE,
      eligible: false,
      reason: `Blocked: Institution has ${blockingCases.length} active regulatory compliance case(s) requiring resolution before administrative clearance.`,
      blockingCaseIds: blockingCases.map((c) => c.caseId || c.caseNumber),
    };
  }

  // 2. Reason-based evaluation
  const cleanReason = (releaseReason || '').toLowerCase();
  const isRenewalBased = cleanReason.includes('renewal') || cleanReason.includes('replacement') || Boolean(renewalRequest);

  if (isRenewalBased) {
    // If renewal-based release, check if renewal was accepted for record
    if (!renewalRequest) {
      return {
        outcome: RELEASE_ELIGIBILITY_OUTCOMES.REQUIRES_ADDITIONAL_EVIDENCE,
        eligible: false,
        reason: 'Renewal-based release requested, but no accepted renewal request was linked.',
      };
    }

    if (renewalRequest.status !== RENEWAL_STATUS.ACCEPTED_FOR_RECORD) {
      return {
        outcome: RELEASE_ELIGIBILITY_OUTCOMES.REQUIRES_ADDITIONAL_EVIDENCE,
        eligible: false,
        reason: `Associated renewal request (${renewalRequest.renewalReference || renewalRequest.renewalRequestId}) is in status ${renewalRequest.status}. It must be accepted for record first.`,
      };
    }

    // Check replacement coverage
    const origPaise = originalFdr.depositAmountPaise || originalFdr.amountPaise || 0;
    const repPaise = renewalRequest.replacementTotalPaise || 0;

    if (repPaise < origPaise) {
      return {
        outcome: RELEASE_ELIGIBILITY_OUTCOMES.POTENTIAL_COVERAGE_SHORTFALL,
        eligible: false,
        reason: `Replacement deposit coverage (₹${(repPaise / 100).toLocaleString('en-IN')}) is less than original deposit amount (₹${(origPaise / 100).toLocaleString('en-IN')}).`,
      };
    }
  }

  // Satisfies initial eligibility for officer administrative review
  return {
    outcome: RELEASE_ELIGIBILITY_OUTCOMES.ELIGIBLE_FOR_ADMINISTRATIVE_REVIEW,
    eligible: true,
    reason: 'FDR record meets advisory criteria for officer administrative clearance scrutiny.',
    details: {
      fdrNumber: originalFdr.fdrNumber,
      institutionId,
      originalAmountPaise: originalFdr.depositAmountPaise || originalFdr.amountPaise,
    },
  };
}
