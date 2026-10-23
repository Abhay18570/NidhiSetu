/**
 * NidhiSetu Renewal & Deposit Continuity — Escalation Engine
 * Evaluates renewal timelines, pending officer reviews, clarification delays,
 * and continuity shortfalls to trigger multi-tier escalations and notifications.
 */

import { ESCALATION_LEVELS, RENEWAL_STATUS } from './renewalModel';
import { getDaysUntilMaturity, normalizeToCalendarDate } from '../storage/fdrMaturityService';

/**
 * Evaluates renewal plans, requests, and releases to identify escalations.
 */
export function evaluateRenewalEscalations({
  fdrs = [],
  renewalRequests = [],
  releaseRequests = [],
  referenceDate = new Date(),
}) {
  const escalations = [];

  // 1. Scan FDRs for uninitiated renewals near or past maturity
  fdrs.forEach((fdr) => {
    const fdrId = String(fdr.id || fdr.fdrId);
    const daysUntilMaturity = getDaysUntilMaturity(fdr.maturityDate, referenceDate);

    // Look for active renewal request
    const activeReq = renewalRequests.find(
      (r) => String(r.originalFdrId) === fdrId && r.status !== 'WITHDRAWN' && r.status !== 'REJECTED'
    );

    if (!activeReq) {
      if (daysUntilMaturity < 0) {
        escalations.push({
          escalationId: `ESC-MAT-${fdrId}`,
          entityType: 'FDR_MATURITY',
          entityId: fdrId,
          institutionId: fdr.institutionId,
          institutionName: fdr.institutionName,
          fdrNumber: fdr.fdrNumber,
          reason: `Deposit matured ${Math.abs(daysUntilMaturity)} days ago without renewal request initiation.`,
          severity: ESCALATION_LEVELS.URGENT,
          triggerDate: fdr.maturityDate,
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          status: 'OPEN',
          assignedTo: null,
          createdAt: new Date().toISOString(),
        });
      } else if (daysUntilMaturity <= 7) {
        escalations.push({
          escalationId: `ESC-CRIT-${fdrId}`,
          entityType: 'FDR_MATURITY',
          entityId: fdrId,
          institutionId: fdr.institutionId,
          institutionName: fdr.institutionName,
          fdrNumber: fdr.fdrNumber,
          reason: `Deposit matures in ${daysUntilMaturity} days. Immediate renewal submission required.`,
          severity: ESCALATION_LEVELS.HIGH_PRIORITY,
          triggerDate: new Date().toISOString().split('T')[0],
          dueDate: fdr.maturityDate,
          status: 'OPEN',
          assignedTo: null,
          createdAt: new Date().toISOString(),
        });
      }
    }
  });

  // 2. Scan Renewal Requests for pending reviews or overdue clarifications
  renewalRequests.forEach((req) => {
    const reqId = req.renewalRequestId;

    // Overdue clarification
    if (req.status === RENEWAL_STATUS.CLARIFICATION_REQUIRED) {
      const activeClarification = (req.clarificationRequests || []).find((c) => c.status === 'AWAITING_REPLY');
      if (activeClarification && activeClarification.deadline) {
        const deadlineCal = normalizeToCalendarDate(activeClarification.deadline);
        const todayCal = normalizeToCalendarDate(referenceDate);

        if (deadlineCal && todayCal && todayCal > deadlineCal) {
          escalations.push({
            escalationId: `ESC-CLAR-${reqId}`,
            entityType: 'RENEWAL_CLARIFICATION_OVERDUE',
            entityId: reqId,
            institutionId: req.institutionId,
            institutionName: req.institutionName,
            fdrNumber: req.originalFdrNumber || req.originalFdrId,
            reason: `Institution response to officer clarification for renewal ${req.renewalReference || reqId} is overdue.`,
            severity: ESCALATION_LEVELS.HIGH_PRIORITY,
            triggerDate: activeClarification.deadline,
            dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
            status: 'OPEN',
            assignedTo: req.assignedOfficerId,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // Awaiting review for > 14 days
    if (req.status === RENEWAL_STATUS.SUBMITTED || req.status === RENEWAL_STATUS.RESUBMITTED) {
      const submittedDate = normalizeToCalendarDate(req.submittedAt || req.createdAt);
      const todayCal = normalizeToCalendarDate(referenceDate);
      if (submittedDate && todayCal) {
        const daysPending = Math.round((todayCal.getTime() - submittedDate.getTime()) / 86400000);
        if (daysPending >= 14) {
          escalations.push({
            escalationId: `ESC-REV-${reqId}`,
            entityType: 'OFFICER_REVIEW_DELAY',
            entityId: reqId,
            institutionId: req.institutionId,
            institutionName: req.institutionName,
            fdrNumber: req.originalFdrNumber || req.originalFdrId,
            reason: `Renewal request ${req.renewalReference || reqId} has been awaiting officer scrutiny for ${daysPending} days.`,
            severity: ESCALATION_LEVELS.ATTENTION_REQUIRED,
            triggerDate: req.submittedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
            status: 'OPEN',
            assignedTo: req.assignedOfficerId,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  });

  return escalations;
}
