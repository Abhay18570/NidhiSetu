/**
 * NidhiSetu Renewal & Deposit Continuity — Deposit Continuity Engine
 * Date-interval integer-paise timeline evaluator for FDR renewal transitions.
 *
 * Evaluates whether declared security deposit coverage remains uninterrupted
 * before, during, and after an FDR renewal or replacement.
 *
 * CRITICAL CALCULATION SPECIFICATION:
 * - Uses exact integer paise (1 Rupee = 100 Paise).
 * - Generates discrete timeline intervals between original maturity and replacement effective/maturity dates.
 * - Detects maturity gaps (when replacement starts AFTER original maturity).
 * - Detects shortfall intervals (when replacement total amount < required deposit).
 * - Avoids double-counting superseded certificates while respecting documented transition overlaps.
 */

import { CONTINUITY_STATUS } from './renewalModel';
import { normalizeToCalendarDate } from '../storage/fdrMaturityService';

/**
 * Normalizes an amount into integer paise
 */
export function toPaise(val) {
  if (val == null) return 0;
  if (typeof val === 'number') {
    return Number.isSafeInteger(val) ? val : Math.round(val);
  }
  const str = String(val);
  const clean = str.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(clean);
  if (isNaN(parsed)) return 0;

  // If string was formatted currency in rupees (e.g. ₹25,00,000.00), convert to paise
  if (str.includes('₹') || str.toLowerCase().includes('rs') || str.toLowerCase().includes('inr')) {
    return Math.round(parsed * 100);
  }

  return Math.round(parsed);
}


/**
 * Calculates continuous deposit coverage across an evaluation timeline.
 *
 * @param {Object} originalFdr - Original FDR record
 * @param {Array<Object>} replacementFdrs - Replacement FDR records (or extension data)
 * @param {Object} applicableRule - Module 06 regulatory rule (optional)
 * @param {Date|string} referenceDate - Reference date
 */
export function calculateDepositContinuity({
  originalFdr,
  replacementFdrs = [],
  applicableRule = null,
  renewalType = 'REPLACEMENT_FDR',
  proposedMaturityDate = null,
}) {
  if (!originalFdr) {
    return {
      continuityStatus: CONTINUITY_STATUS.INDETERMINATE,
      requiredDepositPaise: 0,
      coverageBeforeRenewal: 0,
      coverageDuringTransition: 0,
      coverageAfterRenewal: 0,
      minCoverageAcrossPeriod: 0,
      uncoveredIntervals: [],
      maxShortfallPaise: 0,
      explanation: 'Original FDR record is missing or invalid.',
    };
  }

  const originalPaise = toPaise(originalFdr.depositAmountPaise || originalFdr.amountPaise);
  const requiredPaise = applicableRule && applicableRule.minimumDepositPaise
    ? toPaise(applicableRule.minimumDepositPaise)
    : originalPaise;

  const originalMaturityStr = originalFdr.maturityDate;
  const originalMaturityCal = normalizeToCalendarDate(originalMaturityStr);

  // If this is an extension of an existing FDR
  if (renewalType === 'EXTENSION_OF_EXISTING_FDR') {
    const extMaturityStr = proposedMaturityDate || originalMaturityStr;
    const extMaturityCal = normalizeToCalendarDate(extMaturityStr);

    const isExtended = extMaturityCal && originalMaturityCal && extMaturityCal > originalMaturityCal;
    const coveragePaise = originalPaise;
    const shortfall = Math.max(0, requiredPaise - coveragePaise);

    const status = shortfall > 0
      ? CONTINUITY_STATUS.PARTIAL_DECLARED_COVERAGE
      : CONTINUITY_STATUS.CONTINUOUS_DECLARED_COVERAGE;

    return {
      continuityStatus: status,
      requiredDepositPaise: requiredPaise,
      coverageBeforeRenewal: coveragePaise,
      coverageDuringTransition: coveragePaise,
      coverageAfterRenewal: coveragePaise,
      minCoverageAcrossPeriod: coveragePaise,
      uncoveredIntervals: [],
      maxShortfallPaise: shortfall,
      explanation: isExtended
        ? `Tenure extended from ${originalMaturityStr} to ${extMaturityStr} with continuous coverage of ₹${(coveragePaise / 100).toLocaleString('en-IN')}.`
        : `FDR extension proposed for same or unspecified future date.`,
      timelinePoints: [
        { date: originalFdr.issueDate || '2023-01-01', type: 'ORIGINAL_ISSUE', coveragePaise },
        { date: originalMaturityStr, type: 'EXTENSION_POINT', coveragePaise },
        { date: extMaturityStr, type: 'EXTENDED_MATURITY', coveragePaise },
      ],
    };
  }

  // Multi-replacement or Single replacement
  const replacements = Array.isArray(replacementFdrs) ? replacementFdrs : [replacementFdrs].filter(Boolean);

  if (replacements.length === 0) {
    return {
      continuityStatus: CONTINUITY_STATUS.COVERAGE_GAP,
      requiredDepositPaise: requiredPaise,
      coverageBeforeRenewal: originalPaise,
      coverageDuringTransition: 0,
      coverageAfterRenewal: 0,
      minCoverageAcrossPeriod: 0,
      uncoveredIntervals: [
        {
          startDate: originalMaturityStr,
          endDate: 'INDEFINITE',
          shortfallPaise: requiredPaise,
          reason: 'No replacement FDR submitted to cover tenure after original maturity.',
        },
      ],
      maxShortfallPaise: requiredPaise,
      explanation: 'Missing replacement certificate. Deposit coverage drops to zero upon original maturity.',
      timelinePoints: [],
    };
  }

  // Calculate total replacement amount in paise
  const replacementTotalPaise = replacements.reduce((sum, r) => {
    return sum + toPaise(r.depositAmountPaise || r.amountPaise);
  }, 0);

  // Determine earliest replacement effective date and latest replacement maturity
  let earliestEffectiveCal = null;
  let earliestEffectiveStr = null;
  let latestMaturityCal = null;
  let latestMaturityStr = null;

  replacements.forEach((r) => {
    const effStr = r.effectiveDate || r.issueDate || r.depositDate;
    const matStr = r.maturityDate;

    const effCal = normalizeToCalendarDate(effStr);
    const matCal = normalizeToCalendarDate(matStr);

    if (effCal) {
      if (!earliestEffectiveCal || effCal < earliestEffectiveCal) {
        earliestEffectiveCal = effCal;
        earliestEffectiveStr = effStr;
      }
    }
    if (matCal) {
      if (!latestMaturityCal || matCal > latestMaturityCal) {
        latestMaturityCal = matCal;
        latestMaturityStr = matStr;
      }
    }
  });

  const uncoveredIntervals = [];

  // Check for Date Gap (earliest replacement start is AFTER original maturity)
  if (earliestEffectiveCal && originalMaturityCal && earliestEffectiveCal > originalMaturityCal) {
    const gapDays = Math.round((earliestEffectiveCal.getTime() - originalMaturityCal.getTime()) / (1000 * 60 * 60 * 24));
    uncoveredIntervals.push({
      startDate: originalMaturityStr,
      endDate: earliestEffectiveStr,
      durationDays: gapDays,
      shortfallPaise: requiredPaise,
      type: 'TEMPORAL_GAP',
      reason: `Replacement certificate effective date (${earliestEffectiveStr}) starts ${gapDays} days after original maturity (${originalMaturityStr}).`,
    });
  }

  // Check for Amount Shortfall after replacement
  let maxShortfallPaise = 0;
  if (uncoveredIntervals.length > 0) {
    maxShortfallPaise = requiredPaise;
  } else if (replacementTotalPaise < requiredPaise) {
    maxShortfallPaise = requiredPaise - replacementTotalPaise;
    uncoveredIntervals.push({
      startDate: earliestEffectiveStr || originalMaturityStr,
      endDate: latestMaturityStr || 'INDEFINITE',
      shortfallPaise: maxShortfallPaise,
      type: 'AMOUNT_SHORTFALL',
      reason: `Replacement total of ₹${(replacementTotalPaise / 100).toLocaleString('en-IN')} is less than required ₹${(requiredPaise / 100).toLocaleString('en-IN')} (Shortfall: ₹${(maxShortfallPaise / 100).toLocaleString('en-IN')}).`,
    });
  }

  // Determine overall continuity status
  let continuityStatus;
  let explanation;

  if (uncoveredIntervals.some((i) => i.type === 'TEMPORAL_GAP')) {
    continuityStatus = CONTINUITY_STATUS.COVERAGE_GAP;
    explanation = `Deposit coverage gap detected between ${originalMaturityStr} and ${earliestEffectiveStr}. Unsecured window identified.`;
  } else if (maxShortfallPaise > 0) {
    continuityStatus = CONTINUITY_STATUS.PARTIAL_DECLARED_COVERAGE;
    explanation = `Partial declared coverage: Replacement amount ₹${(replacementTotalPaise / 100).toLocaleString('en-IN')} leaves a shortfall of ₹${(maxShortfallPaise / 100).toLocaleString('en-IN')}.`;
  } else {
    continuityStatus = CONTINUITY_STATUS.CONTINUOUS_DECLARED_COVERAGE;
    explanation = `Uninterrupted continuous coverage verified: Replacement total ₹${(replacementTotalPaise / 100).toLocaleString('en-IN')} meets or exceeds required ₹${(requiredPaise / 100).toLocaleString('en-IN')}.`;
  }

  // Calculate transition coverage (handle documented overlap without double-counting security)
  const coverageBefore = originalPaise;
  const coverageDuring = replacementTotalPaise; // During transition, replacement stands in place of original
  const coverageAfter = replacementTotalPaise;
  const minCoverage = Math.min(coverageBefore, coverageAfter, uncoveredIntervals.length > 0 && uncoveredIntervals[0].type === 'TEMPORAL_GAP' ? 0 : coverageDuring);

  return {
    continuityStatus,
    requiredDepositPaise: requiredPaise,
    coverageBeforeRenewal: coverageBefore,
    coverageDuringTransition: coverageDuring,
    coverageAfterRenewal: coverageAfter,
    minCoverageAcrossPeriod: minCoverage,
    uncoveredIntervals,
    maxShortfallPaise,
    earliestReplacementEffectiveDate: earliestEffectiveStr,
    latestReplacementMaturityDate: latestMaturityStr,
    replacementTotalPaise,
    explanation,
    evaluatedAt: new Date().toISOString(),
  };
}
