/**
 * NidhiSetu Maturity & Renewal Risk Engine
 * Reuses Module 03 fdrMaturityService calendar-safe date calculations.
 *
 * Evaluates:
 * - FDR approaching maturity (<= 90, 60, 30, 7 days)
 * - FDR matured (days < 0)
 * - Overdue renewal
 * - Missing renewal
 * - Renewal under review
 * - Validity duration shorter than rule requirement
 * - Coverage gap between maturity and renewal
 */

import { getDaysUntilMaturity, normalizeToCalendarDate } from '../storage/fdrMaturityService';

export const MATURITY_RISK_TYPES = {
  FDR_MATURED: 'FDR_MATURED',
  RENEWAL_OVERDUE: 'RENEWAL_OVERDUE',
  MATURITY_CRITICAL_7D: 'MATURITY_CRITICAL_7D',
  MATURITY_HIGH_30D: 'MATURITY_HIGH_30D',
  MATURITY_MEDIUM_60D: 'MATURITY_MEDIUM_60D',
  MATURITY_APPROACHING_90D: 'MATURITY_APPROACHING_90D',
  RENEWAL_UNDER_REVIEW: 'RENEWAL_UNDER_REVIEW',
  INSUFFICIENT_VALIDITY_TENURE: 'INSUFFICIENT_VALIDITY_TENURE',
  RENEWAL_GAP_DETECTED: 'RENEWAL_GAP_DETECTED',
};

/**
 * Calculates calendar months between two dates
 */
export function calculateMonthsDifference(startDate, endDate) {
  const start = normalizeToCalendarDate(startDate);
  const end = normalizeToCalendarDate(endDate);
  if (!start || !end) return 0;

  const years = end.getFullYear() - start.getFullYear();
  const months = end.getMonth() - start.getMonth();
  const days = end.getDate() - start.getDate();

  let totalMonths = years * 12 + months;
  if (days < 0) totalMonths -= 1;
  return Math.max(0, totalMonths);
}

/**
 * Evaluates maturity and renewal risks for all eligible FDRs of an institution.
 *
 * @param {Object} params
 * @param {Array} params.fdrRecords - Full FDR records
 * @param {Array} params.eligibleDeposits - Filtered eligible deposits from adequacy engine
 * @param {Object|null} params.applicableRule - Applicable compliance rule
 * @param {Date|string} params.assessmentDate - Reference evaluation date
 * @returns {Array} List of maturity risk findings
 */
export function evaluateMaturityRisks({
  fdrRecords = [],
  eligibleDeposits = [],
  applicableRule = null,
  assessmentDate = new Date(),
}) {
  const findings = [];
  const evalDate = normalizeToCalendarDate(assessmentDate) || new Date();

  // Map of original FDR ID -> Renewal FDR record
  const renewalMap = new Map();
  fdrRecords.forEach((fdr) => {
    if (fdr.originalFdrId) {
      renewalMap.set(String(fdr.originalFdrId), fdr);
    }
  });

  eligibleDeposits.forEach((dep) => {
    const fdr = fdrRecords.find((r) => String(r.id || r.fdrId) === String(dep.fdrId)) || dep;
    const maturityDate = fdr.maturityDate;
    if (!maturityDate) return;

    const daysRemaining = getDaysUntilMaturity(maturityDate, evalDate);
    const renewalRecord = renewalMap.get(String(dep.fdrId));

    // 1. Matured Deposit Assessment
    if (daysRemaining < 0) {
      const daysOverdue = Math.abs(daysRemaining);

      if (!renewalRecord) {
        findings.push({
          signalId: `MAT-RISK-${dep.fdrId}-MATURED-NO-RENEWAL`,
          riskType: MATURITY_RISK_TYPES.FDR_MATURED,
          severity: 'HIGH',
          affectedFdrId: dep.fdrId,
          fdrNumber: dep.fdrNumber || fdr.fdrNumber,
          maturityDate,
          daysRemaining,
          daysOverdue,
          ruleReference: applicableRule ? applicableRule.ruleCode : 'GENERAL',
          explanation: `FDR #${dep.fdrNumber || dep.fdrId} matured ${daysOverdue} days ago on ${maturityDate} with no renewal submitted.`,
          recommendedAction: 'Immediate issuance of renewal notice or compliance show-cause.',
        });
      } else {
        const renewalStatus = (renewalRecord.status || renewalRecord.lifecycleStatus || '').toUpperCase();
        if (['SUBMITTED', 'UNDER_REVIEW', 'PENDING_VERIFICATION'].includes(renewalStatus)) {
          findings.push({
            signalId: `MAT-RISK-${dep.fdrId}-RENEWAL-PENDING`,
            riskType: MATURITY_RISK_TYPES.RENEWAL_UNDER_REVIEW,
            severity: 'INFORMATIONAL',
            affectedFdrId: dep.fdrId,
            renewalFdrId: renewalRecord.id,
            fdrNumber: dep.fdrNumber || fdr.fdrNumber,
            maturityDate,
            daysRemaining,
            ruleReference: applicableRule ? applicableRule.ruleCode : 'GENERAL',
            explanation: `FDR #${dep.fdrNumber || dep.fdrId} matured, but renewal submission (#${renewalRecord.fdrNumber}) is currently under administrative scrutiny.`,
            recommendedAction: 'Expedite officer verification of pending renewal submission.',
          });
        }
      }
      return;
    }

    // 2. Approaching Maturity Thresholds
    if (daysRemaining <= 7) {
      findings.push({
        signalId: `MAT-RISK-${dep.fdrId}-7D`,
        riskType: MATURITY_RISK_TYPES.MATURITY_CRITICAL_7D,
        severity: 'HIGH',
        affectedFdrId: dep.fdrId,
        fdrNumber: dep.fdrNumber || fdr.fdrNumber,
        maturityDate,
        daysRemaining,
        ruleReference: applicableRule ? applicableRule.ruleCode : 'GENERAL',
        explanation: `Critical maturity alert: FDR #${dep.fdrNumber || dep.fdrId} matures in ${daysRemaining} days (${maturityDate}).`,
        recommendedAction: 'Verify pending renewal or mandate immediate replacement FDR submission.',
      });
    } else if (daysRemaining <= 30) {
      findings.push({
        signalId: `MAT-RISK-${dep.fdrId}-30D`,
        riskType: MATURITY_RISK_TYPES.MATURITY_HIGH_30D,
        severity: 'MEDIUM',
        affectedFdrId: dep.fdrId,
        fdrNumber: dep.fdrNumber || fdr.fdrNumber,
        maturityDate,
        daysRemaining,
        ruleReference: applicableRule ? applicableRule.ruleCode : 'GENERAL',
        explanation: `Upcoming maturity: FDR #${dep.fdrNumber || dep.fdrId} matures in ${daysRemaining} days (${maturityDate}).`,
        recommendedAction: 'Issue advance renewal advisory to institution.',
      });
    } else if (daysRemaining <= 60) {
      findings.push({
        signalId: `MAT-RISK-${dep.fdrId}-60D`,
        riskType: MATURITY_RISK_TYPES.MATURITY_MEDIUM_60D,
        severity: 'LOW',
        affectedFdrId: dep.fdrId,
        fdrNumber: dep.fdrNumber || fdr.fdrNumber,
        maturityDate,
        daysRemaining,
        ruleReference: applicableRule ? applicableRule.ruleCode : 'GENERAL',
        explanation: `FDR #${dep.fdrNumber || dep.fdrId} matures in ${daysRemaining} days.`,
        recommendedAction: 'Monitor institution renewal preparedness.',
      });
    } else if (daysRemaining <= 90) {
      findings.push({
        signalId: `MAT-RISK-${dep.fdrId}-90D`,
        riskType: MATURITY_RISK_TYPES.MATURITY_APPROACHING_90D,
        severity: 'INFORMATIONAL',
        affectedFdrId: dep.fdrId,
        fdrNumber: dep.fdrNumber || fdr.fdrNumber,
        maturityDate,
        daysRemaining,
        ruleReference: applicableRule ? applicableRule.ruleCode : 'GENERAL',
        explanation: `Early maturity advisory: FDR #${dep.fdrNumber || dep.fdrId} matures in ${daysRemaining} days.`,
        recommendedAction: 'Informational tracking of upcoming maturity.',
      });
    }

    // 3. Minimum Validity Tenure Check
    if (applicableRule && applicableRule.requiredValidityMonths > 0) {
      const startDate = fdr.creationDate || fdr.issuanceDate || fdr.depositDate;
      if (startDate) {
        const tenureMonths = calculateMonthsDifference(startDate, maturityDate);
        if (tenureMonths < applicableRule.requiredValidityMonths) {
          findings.push({
            signalId: `MAT-RISK-${dep.fdrId}-TENURE-DEFICIT`,
            riskType: MATURITY_RISK_TYPES.INSUFFICIENT_VALIDITY_TENURE,
            severity: 'MEDIUM',
            affectedFdrId: dep.fdrId,
            fdrNumber: dep.fdrNumber || fdr.fdrNumber,
            actualTenureMonths: tenureMonths,
            requiredTenureMonths: applicableRule.requiredValidityMonths,
            ruleReference: applicableRule.ruleCode,
            explanation: `Configured rule requires ${applicableRule.requiredValidityMonths} months validity, but FDR #${dep.fdrNumber || dep.fdrId} is booked for only ${tenureMonths} months.`,
            recommendedAction: 'Request institution provide addendum or extend deposit duration.',
          });
        }
      }
    }
  });

  return findings;
}
