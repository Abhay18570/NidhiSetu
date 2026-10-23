/**
 * NidhiSetu Renewal & Deposit Continuity — Smart Renewal Planner
 * Scans institution FDRs, evaluates calendar-safe maturity thresholds (90d, 60d, 30d, 7d, matured, overdue),
 * and computes renewal deadlines, priority levels, and recommended actions.
 */

import { getDaysUntilMaturity, normalizeToCalendarDate } from '../storage/fdrMaturityService';
import { RENEWAL_STATUS } from './renewalModel';

export const PLANNING_WINDOW = {
  OVERDUE: 'OVERDUE',
  MATURED: 'MATURED',
  CRITICAL_7: 'CRITICAL_7',
  APPROACHING_30: 'APPROACHING_30',
  APPROACHING_60: 'APPROACHING_60',
  APPROACHING_90: 'APPROACHING_90',
  NORMAL: 'NORMAL',
};

export const RENEWAL_PRIORITY = {
  URGENT: 'URGENT',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  NORMAL: 'NORMAL',
};

/**
 * Classifies days remaining into a prototype planning window
 */
export function getPlanningWindow(daysRemaining) {
  if (daysRemaining < -15) return PLANNING_WINDOW.OVERDUE;
  if (daysRemaining <= 0) return PLANNING_WINDOW.MATURED;
  if (daysRemaining <= 7) return PLANNING_WINDOW.CRITICAL_7;
  if (daysRemaining <= 30) return PLANNING_WINDOW.APPROACHING_30;
  if (daysRemaining <= 60) return PLANNING_WINDOW.APPROACHING_60;
  if (daysRemaining <= 90) return PLANNING_WINDOW.APPROACHING_90;
  return PLANNING_WINDOW.NORMAL;
}

/**
 * Assigns an action priority based on planning window and active submission status
 */
export function getRenewalPriority(windowType, submissionStatus) {
  if (submissionStatus === RENEWAL_STATUS.ACCEPTED_FOR_RECORD) {
    return RENEWAL_PRIORITY.NORMAL;
  }
  if (windowType === PLANNING_WINDOW.OVERDUE || windowType === PLANNING_WINDOW.MATURED) {
    return RENEWAL_PRIORITY.URGENT;
  }
  if (windowType === PLANNING_WINDOW.CRITICAL_7) {
    return RENEWAL_PRIORITY.URGENT;
  }
  if (windowType === PLANNING_WINDOW.APPROACHING_30) {
    return RENEWAL_PRIORITY.HIGH;
  }
  if (windowType === PLANNING_WINDOW.APPROACHING_60) {
    return RENEWAL_PRIORITY.MEDIUM;
  }
  if (windowType === PLANNING_WINDOW.APPROACHING_90) {
    return RENEWAL_PRIORITY.LOW;
  }
  return RENEWAL_PRIORITY.NORMAL;
}

/**
 * Generates actionable recommendation for institutions
 */
export function getRecommendedAction(daysRemaining, activeRequest) {
  if (activeRequest) {
    switch (activeRequest.status) {
      case RENEWAL_STATUS.DRAFT:
        return 'Resume and submit the pending renewal request draft.';
      case RENEWAL_STATUS.SUBMITTED:
      case RENEWAL_STATUS.UNDER_REVIEW:
        return 'Awaiting officer scrutiny. Monitor clarification inbox.';
      case RENEWAL_STATUS.CLARIFICATION_REQUIRED:
        return 'Clarification requested by officer. Submit supplementary details promptly.';
      case RENEWAL_STATUS.RESUBMITTED:
        return 'Resubmission under officer review.';
      case RENEWAL_STATUS.ACCEPTED_FOR_RECORD:
        return 'Renewal accepted for regulatory record. You may initiate an administrative release request for the superseded certificate if desired.';
      case RENEWAL_STATUS.REJECTED:
        return 'Previous renewal request was declined. Prepare and submit a rectified renewal application.';
      default:
        break;
    }
  }

  if (daysRemaining < 0) {
    return 'CRITICAL: Deposit has matured. Initiate replacement FDR submission or renewal extension immediately to prevent regulatory non-compliance.';
  }
  if (daysRemaining <= 7) {
    return 'URGENT: Maturity within 7 days. Submit replacement deposit details or renewal documentation.';
  }
  if (daysRemaining <= 30) {
    return 'HIGH: Deposit matures in under 30 days. Obtain renewed FDR or replacement guarantee from issuing bank.';
  }
  if (daysRemaining <= 90) {
    return 'Initiate renewal planning with issuing bank for seamless deposit continuity.';
  }
  return 'Deposit is active and within standard operational validity. No immediate renewal action required.';
}

/**
 * Generates an individualized renewal plan for an FDR
 * @param {Object} fdr - FDR record from fdrRepository
 * @param {Array} existingRequests - List of renewal requests to check existing cycle
 * @param {Date|string} referenceDate - Reference date (default today)
 */
export function buildRenewalPlan(fdr, existingRequests = [], referenceDate = new Date()) {
  if (!fdr) return null;

  const maturityDateStr = fdr.maturityDate;
  const daysUntilMaturity = getDaysUntilMaturity(maturityDateStr, referenceDate);
  const windowType = getPlanningWindow(daysUntilMaturity);

  // Calculate planning deadline (30 days before maturity)
  let planningDeadline = null;
  const maturityCal = normalizeToCalendarDate(maturityDateStr);
  if (maturityCal) {
    const deadlineDate = new Date(maturityCal);
    deadlineDate.setUTCDate(deadlineDate.getUTCDate() - 30);
    planningDeadline = deadlineDate.toISOString().split('T')[0];
  }

  // Find active renewal request for this FDR
  const activeRequest = existingRequests.find(
    (req) =>
      String(req.originalFdrId) === String(fdr.id || fdr.fdrId) &&
      req.status !== RENEWAL_STATUS.WITHDRAWN &&
      req.status !== RENEWAL_STATUS.REJECTED
  ) || null;

  const submissionStatus = activeRequest ? activeRequest.status : 'NO_REQUEST';
  const priority = getRenewalPriority(windowType, submissionStatus);
  const recommendedAction = getRecommendedAction(daysUntilMaturity, activeRequest);

  // Check replacement coverage gap if replacement is linked
  let potentialCoverageGap = false;
  let shortfallPaise = 0;
  if (activeRequest && activeRequest.replacementTotalPaise != null) {
    const originalPaise = fdr.depositAmountPaise || fdr.amountPaise || 0;
    if (activeRequest.replacementTotalPaise < originalPaise) {
      potentialCoverageGap = true;
      shortfallPaise = originalPaise - activeRequest.replacementTotalPaise;
    }
  }

  return {
    planId: `PLN-${fdr.id || fdr.fdrId}`,
    fdrId: fdr.id || fdr.fdrId,
    fdrNumber: fdr.fdrNumber,
    institutionId: fdr.institutionId,
    institutionName: fdr.institutionName,
    currentMaturityDate: maturityDateStr,
    daysUntilMaturity,
    planningWindow: windowType,
    planningDeadline,
    renewalSubmissionStatus: submissionStatus,
    activeRequestId: activeRequest ? activeRequest.renewalRequestId : null,
    activeRequestReference: activeRequest ? activeRequest.renewalReference : null,
    replacementFdrIds: activeRequest ? activeRequest.replacementFdrIds || [] : [],
    potentialCoverageGap,
    shortfallPaise,
    priorityLevel: priority,
    recommendedNextAction: recommendedAction,
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Evaluates all FDRs for an institution or overall system and generates renewal plans
 */
export function generateRenewalPlans(fdrs = [], existingRequests = [], referenceDate = new Date()) {
  if (!Array.isArray(fdrs)) return [];

  // Group plans by FDR to avoid duplicates
  const plans = [];
  const processedFdrIds = new Set();

  for (const fdr of fdrs) {
    const id = fdr.id || fdr.fdrId;
    if (!id || processedFdrIds.has(String(id))) continue;
    processedFdrIds.add(String(id));

    // Exclude cancelled records if marked
    if (fdr.status === 'CANCELLED' || fdr.status === 'SUPERSEDED') continue;

    const plan = buildRenewalPlan(fdr, existingRequests, referenceDate);
    if (plan) plans.push(plan);
  }

  // Sort by days until maturity ascending (most urgent first)
  return plans.sort((a, b) => a.daysUntilMaturity - b.daysUntilMaturity);
}
