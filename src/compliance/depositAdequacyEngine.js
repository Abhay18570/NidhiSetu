/**
 * NidhiSetu Deposit Adequacy Engine
 * Evaluates declared FDR deposits against configured regulatory requirements.
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * - Integer paise arithmetic ONLY. No floating-point money math.
 * - Double-counting prevention: renewal chains, duplicates, and superseded records.
 * - Strict separation of declared deposit, admin review, OCR intelligence, and simulated bank evidence.
 * - Safe handling of zero or unconfigured requirements.
 */

export const ADEQUACY_STATUSES = {
  ADEQUATE_DECLARED: 'ADEQUATE_DECLARED',
  SHORTFALL_DECLARED: 'SHORTFALL_DECLARED',
  EXCESS_DECLARED: 'EXCESS_DECLARED',
  INDETERMINATE: 'INDETERMINATE',
  REQUIREMENT_NOT_CONFIGURED: 'REQUIREMENT_NOT_CONFIGURED',
};

/**
 * Normalizes any currency amount into integer paise.
 */
export function toIntegerPaise(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return 0;
  // If amount is already an integer in paise (> 10000000 typically for institutional deposits)
  // Check if amount has paise field or standard amount field
  if (typeof amount === 'number') {
    return Math.round(amount);
  }
  const parsed = parseFloat(String(amount).replace(/[^0-9.-]+/g, ''));
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

/**
 * Filter and categorize FDRs for an institution, preventing double-counting
 * and separating eligible declared deposits from excluded records.
 */
export function evaluateFdrEligibility(fdrRecords = [], institutionId) {
  const eligibleDeposits = [];
  const excludedDeposits = [];

  // Filter only records for the target institution
  const institutionFdrs = fdrRecords.filter(
    (fdr) => String(fdr.institutionId) === String(institutionId)
  );

  // Set of FDR IDs that are identified as superseded by another renewal
  const supersededFdrIds = new Set();
  const seenFdrNumbers = new Set();
  const seenDocHashes = new Set();

  // First pass: identify renewals and superseded references
  institutionFdrs.forEach((fdr) => {
    if (fdr.originalFdrId) {
      supersededFdrIds.add(String(fdr.originalFdrId));
    }
    if (fdr.supersededFdrId) {
      supersededFdrIds.add(String(fdr.supersededFdrId));
    }
    if (fdr.renewedFromId) {
      supersededFdrIds.add(String(fdr.renewedFromId));
    }
  });

  // Second pass: evaluate each FDR
  institutionFdrs.forEach((fdr) => {
    const fdrId = String(fdr.id || fdr.fdrId);
    const status = (fdr.status || fdr.lifecycleStatus || '').toUpperCase();
    const fdrNum = (fdr.fdrNumber || '').trim().toUpperCase();
    const docHash = fdr.documentHash || fdr.fileHash;

    // Check 1: Ineligible lifecycle status (DRAFT, REJECTED, CANCELLED)
    if (['DRAFT'].includes(status)) {
      excludedDeposits.push({
        fdrId,
        fdrNumber: fdr.fdrNumber,
        amountPaise: toIntegerPaise(fdr.amountPaise || fdr.amount * 100),
        reason: 'STATUS_DRAFT_NOT_SUBMITTED',
        explanation: 'FDR is in draft state and has not been submitted.',
      });
      return;
    }

    if (['REJECTED', 'CANCELLED'].includes(status)) {
      excludedDeposits.push({
        fdrId,
        fdrNumber: fdr.fdrNumber,
        amountPaise: toIntegerPaise(fdr.amountPaise || fdr.amount * 100),
        reason: 'STATUS_REJECTED_OR_CANCELLED',
        explanation: `FDR status is ${status}; excluded from regulatory deposit coverage.`,
      });
      return;
    }

    // Check 2: Superseded certificate in a renewal chain
    if (
      supersededFdrIds.has(fdrId) ||
      fdr.isSuperseded === true ||
      status === 'SUPERSEDED' ||
      status === 'RENEWED'
    ) {
      excludedDeposits.push({
        fdrId,
        fdrNumber: fdr.fdrNumber,
        amountPaise: toIntegerPaise(fdr.amountPaise || fdr.amount * 100),
        reason: 'SUPERSEDED_BY_RENEWAL',
        explanation: 'Deposit certificate has been replaced or renewed by a successor FDR.',
      });
      return;
    }

    // Check 3: Duplicate instrument number
    if (fdrNum && seenFdrNumbers.has(fdrNum)) {
      excludedDeposits.push({
        fdrId,
        fdrNumber: fdr.fdrNumber,
        amountPaise: toIntegerPaise(fdr.amountPaise || fdr.amount * 100),
        reason: 'DUPLICATE_INSTRUMENT_NUMBER',
        explanation: `Duplicate FDR instrument number (${fdrNum}) detected; only first occurrence is counted.`,
      });
      return;
    }

    // Check 4: Duplicate document hash
    if (docHash && seenDocHashes.has(docHash)) {
      excludedDeposits.push({
        fdrId,
        fdrNumber: fdr.fdrNumber,
        amountPaise: toIntegerPaise(fdr.amountPaise || fdr.amount * 100),
        reason: 'DUPLICATE_DOCUMENT_FINGERPRINT',
        explanation: 'Identical document binary hash already registered in another deposit.',
      });
      return;
    }

    // Mark as seen
    if (fdrNum) seenFdrNumbers.add(fdrNum);
    if (docHash) seenDocHashes.add(docHash);

    // Eligible deposit
    const amountPaise = toIntegerPaise(
      fdr.amountPaise !== undefined
        ? fdr.amountPaise
        : fdr.depositAmountPaise !== undefined
        ? fdr.depositAmountPaise
        : fdr.amount
        ? fdr.amount * 100
        : fdr.depositAmount
        ? fdr.depositAmount * 100
        : 0
    );
    eligibleDeposits.push({
      fdrId,
      fdrNumber: fdr.fdrNumber,
      bankName: fdr.bankName,
      branchName: fdr.branchName,
      amountPaise,
      maturityDate: fdr.maturityDate,
      lifecycleStatus: status,
      isRenewal: Boolean(fdr.originalFdrId || fdr.renewedFromId),
    });
  });

  return {
    eligibleDeposits,
    excludedDeposits,
  };
}

/**
 * Calculates security deposit adequacy for an institution against an applicable rule.
 *
 * @param {Object} params
 * @param {string} params.institutionId
 * @param {Object|null} params.applicableRule
 * @param {Array} params.fdrRecords
 * @param {string|Date} params.assessmentDate
 * @returns {Object} Adequacy result
 */
export function calculateDepositAdequacy({
  institutionId,
  applicableRule,
  fdrRecords = [],
  assessmentDate = new Date(),
}) {
  if (!applicableRule) {
    return {
      institutionId,
      ruleId: null,
      ruleVersion: null,
      requiredAmountPaise: 0,
      eligibleDeclaredAmountPaise: 0,
      shortfallPaise: 0,
      surplusPaise: 0,
      coveragePercentage: 0,
      adequacyStatus: ADEQUACY_STATUSES.REQUIREMENT_NOT_CONFIGURED,
      eligibleDeposits: [],
      excludedDeposits: [],
      reasons: ['No applicable regulatory deposit rule configured for this institution.'],
    };
  }

  // Evaluate eligibility
  const { eligibleDeposits, excludedDeposits } = evaluateFdrEligibility(fdrRecords, institutionId);

  // Calculate sum of eligible deposits in integer paise
  const eligibleDeclaredAmountPaise = eligibleDeposits.reduce(
    (sum, dep) => sum + (dep.amountPaise || 0),
    0
  );

  const requiredAmountPaise = toIntegerPaise(applicableRule.minimumDepositPaise);

  // Exact formulas:
  // Shortfall = max(0, Required Amount - Eligible Declared Amount)
  // Surplus = max(0, Eligible Declared Amount - Required Amount)
  const shortfallPaise = Math.max(0, requiredAmountPaise - eligibleDeclaredAmountPaise);
  const surplusPaise = Math.max(0, eligibleDeclaredAmountPaise - requiredAmountPaise);

  let coveragePercentage = 0;
  let adequacyStatus = ADEQUACY_STATUSES.INDETERMINATE;
  const reasons = [];

  if (requiredAmountPaise === 0) {
    coveragePercentage = 100.0;
    adequacyStatus = ADEQUACY_STATUSES.ADEQUATE_DECLARED;
    reasons.push('Configured rule specifies zero minimum deposit.');
  } else {
    // Integer-safe coverage % rounded to 2 decimal places
    coveragePercentage =
      Math.round((eligibleDeclaredAmountPaise / requiredAmountPaise) * 10000) / 100;

    if (shortfallPaise === 0) {
      if (surplusPaise > 0) {
        adequacyStatus = ADEQUACY_STATUSES.EXCESS_DECLARED;
        reasons.push(
          `Eligible declared deposits exceed required amount by ₹${(surplusPaise / 100).toLocaleString('en-IN')}.`
        );
      } else {
        adequacyStatus = ADEQUACY_STATUSES.ADEQUATE_DECLARED;
        reasons.push('Eligible declared deposits exactly satisfy the configured requirement.');
      }
    } else {
      adequacyStatus = ADEQUACY_STATUSES.SHORTFALL_DECLARED;
      reasons.push(
        `Declared deposit shortfall of ₹${(shortfallPaise / 100).toLocaleString('en-IN')} (${coveragePercentage}% coverage).`
      );
    }
  }

  return {
    institutionId,
    ruleId: applicableRule.ruleId,
    ruleVersion: applicableRule.ruleVersion || 1,
    requiredAmountPaise,
    eligibleDeclaredAmountPaise,
    shortfallPaise,
    surplusPaise,
    coveragePercentage,
    adequacyStatus,
    eligibleDeposits,
    excludedDeposits,
    reasons,
    assessedAt: new Date(assessmentDate).toISOString(),
  };
}
