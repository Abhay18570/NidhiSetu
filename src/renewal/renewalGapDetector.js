/**
 * NidhiSetu Renewal & Deposit Continuity — Coverage Gap Detector
 * Systematically identifies temporal, financial, and tenure gaps across renewal cycles.
 */

import { normalizeToCalendarDate } from '../storage/fdrMaturityService';
import { toPaise } from './renewalContinuityEngine';

export const GAP_TYPES = {
  TEMPORAL_START_GAP: 'TEMPORAL_START_GAP',
  AMOUNT_SHORTFALL: 'AMOUNT_SHORTFALL',
  MISSING_REPLACEMENT: 'MISSING_REPLACEMENT',
  TENURE_DEFICIT: 'TENURE_DEFICIT',
  REPLACEMENT_PENDING_REVIEW: 'REPLACEMENT_PENDING_REVIEW',
  CONFLICTING_CHAIN: 'CONFLICTING_CHAIN',
};

export const GAP_SEVERITY = {
  URGENT: 'URGENT',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

/**
 * Scans an FDR and its proposed renewal/replacements for coverage gaps.
 */
export function detectCoverageGaps({
  originalFdr,
  replacementFdrs = [],
  renewalRequest = null,
  applicableRule = null,
  minRequiredTenureMonths = 36,
}) {
  if (!originalFdr) return [];

  const gaps = [];
  const originalFdrId = String(originalFdr.id || originalFdr.fdrId);
  const institutionId = originalFdr.institutionId;
  const originalMaturityStr = originalFdr.maturityDate;
  const originalMaturityCal = normalizeToCalendarDate(originalMaturityStr);
  const originalPaise = toPaise(originalFdr.depositAmountPaise || originalFdr.amountPaise);
  const requiredPaise = applicableRule && applicableRule.minimumDepositPaise
    ? toPaise(applicableRule.minimumDepositPaise)
    : originalPaise;

  const replacements = Array.isArray(replacementFdrs) ? replacementFdrs : [replacementFdrs].filter(Boolean);

  // 1. Missing Replacement check (if past maturity and no replacement)
  if (replacements.length === 0 && renewalRequest?.renewalType !== 'EXTENSION_OF_EXISTING_FDR') {
    const todayCal = normalizeToCalendarDate(new Date());
    const isMatured = originalMaturityCal && todayCal && todayCal > originalMaturityCal;

    gaps.push({
      gapId: `GAP-MISSING-${originalFdrId}`,
      gapType: GAP_TYPES.MISSING_REPLACEMENT,
      institutionId,
      originalFdrId,
      relatedReplacementFdrIds: [],
      gapStartDate: originalMaturityStr,
      gapEndDate: null,
      maxShortfallPaise: requiredPaise,
      severity: isMatured ? GAP_SEVERITY.URGENT : GAP_SEVERITY.HIGH,
      explanation: 'No replacement certificate or extension record has been submitted for this deposit.',
      suggestedAction: 'Submit replacement FDR or request tenure extension prior to maturity.',
    });

    return gaps;
  }

  // 2. Replacement starts after original maturity (Temporal Start Gap)
  let earliestEffectiveCal = null;
  let earliestEffectiveStr = null;
  let replacementTotalPaise = 0;

  replacements.forEach((rep) => {
    const effStr = rep.effectiveDate || rep.issueDate;
    const effCal = normalizeToCalendarDate(effStr);
    if (effCal) {
      if (!earliestEffectiveCal || effCal < earliestEffectiveCal) {
        earliestEffectiveCal = effCal;
        earliestEffectiveStr = effStr;
      }
    }
    replacementTotalPaise += toPaise(rep.depositAmountPaise || rep.amountPaise);
  });

  if (earliestEffectiveCal && originalMaturityCal && earliestEffectiveCal > originalMaturityCal) {
    const daysUncovered = Math.round((earliestEffectiveCal.getTime() - originalMaturityCal.getTime()) / (1000 * 60 * 60 * 24));
    gaps.push({
      gapId: `GAP-TIME-${originalFdrId}`,
      gapType: GAP_TYPES.TEMPORAL_START_GAP,
      institutionId,
      originalFdrId,
      relatedReplacementFdrIds: replacements.map((r) => r.id || r.fdrId),
      gapStartDate: originalMaturityStr,
      gapEndDate: earliestEffectiveStr,
      maxShortfallPaise: requiredPaise,
      severity: daysUncovered > 30 ? GAP_SEVERITY.URGENT : GAP_SEVERITY.HIGH,
      explanation: `Replacement coverage begins on ${earliestEffectiveStr}, leaving ${daysUncovered} days uncovered after original maturity on ${originalMaturityStr}.`,
      suggestedAction: 'Provide bank documentation verifying deposit coverage during the interim period.',
    });
  }

  // 3. Amount Shortfall Gap
  if (replacementTotalPaise < requiredPaise) {
    const shortfallPaise = requiredPaise - replacementTotalPaise;
    gaps.push({
      gapId: `GAP-AMT-${originalFdrId}`,
      gapType: GAP_TYPES.AMOUNT_SHORTFALL,
      institutionId,
      originalFdrId,
      relatedReplacementFdrIds: replacements.map((r) => r.id || r.fdrId),
      gapStartDate: earliestEffectiveStr || originalMaturityStr,
      gapEndDate: null,
      maxShortfallPaise: shortfallPaise,
      severity: shortfallPaise > (requiredPaise * 0.2) ? GAP_SEVERITY.HIGH : GAP_SEVERITY.MEDIUM,
      explanation: `Replacement deposits total ₹${(replacementTotalPaise / 100).toLocaleString('en-IN')}, which is ₹${(shortfallPaise / 100).toLocaleString('en-IN')} below the required ₹${(requiredPaise / 100).toLocaleString('en-IN')}.`,
      suggestedAction: 'Submit a supplementary FDR or top-up guarantee to meet the required deposit baseline.',
    });
  }

  // 4. Tenure Deficit Gap (replacement maturity < required minimum months from effective)
  replacements.forEach((rep) => {
    const effCal = normalizeToCalendarDate(rep.effectiveDate || rep.issueDate);
    const matCal = normalizeToCalendarDate(rep.maturityDate);
    if (effCal && matCal) {
      const tenureMonths = Math.round((matCal.getTime() - effCal.getTime()) / (1000 * 60 * 60 * 24 * 30.4375));
      if (tenureMonths < minRequiredTenureMonths) {
        gaps.push({
          gapId: `GAP-TENURE-${rep.id || rep.fdrId}`,
          gapType: GAP_TYPES.TENURE_DEFICIT,
          institutionId,
          originalFdrId,
          relatedReplacementFdrIds: [rep.id || rep.fdrId],
          gapStartDate: rep.maturityDate,
          gapEndDate: null,
          maxShortfallPaise: toPaise(rep.depositAmountPaise || rep.amountPaise),
          severity: GAP_SEVERITY.MEDIUM,
          explanation: `Replacement FDR ${rep.fdrNumber} tenure is ${tenureMonths} months, less than recommended ${minRequiredTenureMonths} months minimum duration.`,
          suggestedAction: 'Confirm with issuing bank whether certificate includes auto-renewal or requires early extension.',
        });
      }
    }
  });

  return gaps;
}
