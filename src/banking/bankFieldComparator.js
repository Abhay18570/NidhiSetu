/**
 * NidhiSetu Banking Simulator — Bank Data Comparison Engine
 * Deterministic comparison between institution-submitted FDR records and synthetic bank responses.
 *
 * NOTE: STRICTLY COMPARATIVE LOGIC FOR DEMONSTRATION AND AUDITING.
 * Does not constitute proof of real-world banking fraud.
 */

export const COMPARISON_OUTCOME = {
  MATCH: 'MATCH',
  MISMATCH: 'MISMATCH',
  MISSING_IN_BANK_RESPONSE: 'MISSING_IN_BANK_RESPONSE',
  MISSING_IN_SUBMISSION: 'MISSING_IN_SUBMISSION',
  INDETERMINATE: 'INDETERMINATE',
};

export const COMPARISON_FINDINGS = {
  SIMULATED_DEPOSIT_MATCH: 'SIMULATED_DEPOSIT_MATCH',
  SIMULATED_AMOUNT_MISMATCH: 'SIMULATED_AMOUNT_MISMATCH',
  SIMULATED_MATURITY_MISMATCH: 'SIMULATED_MATURITY_MISMATCH',
  SIMULATED_FDR_NOT_FOUND: 'SIMULATED_FDR_NOT_FOUND',
  SIMULATED_LIEN_MISSING: 'SIMULATED_LIEN_MISSING',
  SIMULATED_LIEN_BENEFICIARY_MISMATCH: 'SIMULATED_LIEN_BENEFICIARY_MISMATCH',
  SIMULATED_ACCOUNT_HOLDER_MISMATCH: 'SIMULATED_ACCOUNT_HOLDER_MISMATCH',
  SIMULATED_DEPOSIT_DATE_MISMATCH: 'SIMULATED_DEPOSIT_DATE_MISMATCH',
  SIMULATED_RESPONSE_TIMEOUT: 'SIMULATED_RESPONSE_TIMEOUT',
  SIMULATED_INVALID_RESPONSE: 'SIMULATED_INVALID_RESPONSE',
};

/**
 * Normalizes string by trimming and collapsing multiple spaces
 */
function normalizeString(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim().replace(/\s+/g, ' ').toUpperCase();
}

/**
 * Normalizes date to YYYY-MM-DD
 */
function normalizeDate(val) {
  if (!val) return null;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

export const bankFieldComparator = {
  /**
   * Compares an institution-submitted FDR against the simulated bank response.
   *
   * @param {Object} submitted - The submitted FDR record from Module 03
   * @param {Object} bankResponse - The simulated bank response
   * @returns {Object} Comprehensive field-by-field comparison and findings
   */
  compareFdrWithBankResponse(submitted, bankResponse) {
    if (!bankResponse) {
      return {
        overallOutcome: COMPARISON_OUTCOME.INDETERMINATE,
        findings: [COMPARISON_FINDINGS.SIMULATED_RESPONSE_TIMEOUT],
        fieldComparisons: {},
        summaryText: 'No bank response available to evaluate.',
      };
    }

    if (bankResponse.responseStatus === 'TIMEOUT') {
      return {
        overallOutcome: COMPARISON_OUTCOME.INDETERMINATE,
        findings: [COMPARISON_FINDINGS.SIMULATED_RESPONSE_TIMEOUT],
        fieldComparisons: {},
        summaryText: 'Simulated bank request timed out. Verification indeterminate.',
      };
    }

    if (bankResponse.responseStatus === 'MALFORMED') {
      return {
        overallOutcome: COMPARISON_OUTCOME.INDETERMINATE,
        findings: [COMPARISON_FINDINGS.SIMULATED_INVALID_RESPONSE],
        fieldComparisons: {},
        summaryText: 'Simulated bank message failed schema validation.',
      };
    }

    if (bankResponse.depositExistenceStatus === 'NOT_FOUND_IN_SYNTHETIC_LEDGER') {
      return {
        overallOutcome: COMPARISON_OUTCOME.MISMATCH,
        findings: [COMPARISON_FINDINGS.SIMULATED_FDR_NOT_FOUND],
        fieldComparisons: {
          fdrNumber: {
            field: 'fdrNumber',
            submittedValue: submitted?.fdrNumber || null,
            bankValue: null,
            outcome: COMPARISON_OUTCOME.MISSING_IN_BANK_RESPONSE,
            explanation: 'Instrument reference not located in issuing bank synthetic ledger.',
          },
        },
        summaryText: 'FDR instrument was not located in the issuing bank synthetic ledger.',
      };
    }

    const fieldComparisons = {};
    const findings = [];

    // 1. FDR Number
    const normSubFdr = normalizeString(submitted?.fdrNumber);
    const normBankFdr = normalizeString(bankResponse.bankReportedFdrNumber);
    if (!normSubFdr) {
      fieldComparisons.fdrNumber = {
        field: 'fdrNumber',
        submittedValue: submitted?.fdrNumber,
        bankValue: bankResponse.bankReportedFdrNumber,
        outcome: COMPARISON_OUTCOME.MISSING_IN_SUBMISSION,
      };
    } else if (!normBankFdr) {
      fieldComparisons.fdrNumber = {
        field: 'fdrNumber',
        submittedValue: submitted?.fdrNumber,
        bankValue: bankResponse.bankReportedFdrNumber,
        outcome: COMPARISON_OUTCOME.MISSING_IN_BANK_RESPONSE,
      };
    } else if (normSubFdr === normBankFdr) {
      fieldComparisons.fdrNumber = {
        field: 'fdrNumber',
        submittedValue: submitted?.fdrNumber,
        bankValue: bankResponse.bankReportedFdrNumber,
        outcome: COMPARISON_OUTCOME.MATCH,
        explanation: 'FDR reference matches synthetic bank ledger.',
      };
    } else {
      fieldComparisons.fdrNumber = {
        field: 'fdrNumber',
        submittedValue: submitted?.fdrNumber,
        bankValue: bankResponse.bankReportedFdrNumber,
        outcome: COMPARISON_OUTCOME.MISMATCH,
        explanation: 'FDR numbers do not match.',
      };
      findings.push(COMPARISON_FINDINGS.SIMULATED_FDR_NOT_FOUND);
    }

    // 2. Deposit Amount in integer paise
    const subPaise = Number(submitted?.depositAmountPaise) || 0;
    const bankPaise =
      bankResponse.bankReportedAmountPaise !== null && bankResponse.bankReportedAmountPaise !== undefined
        ? Number(bankResponse.bankReportedAmountPaise)
        : null;

    if (bankPaise === null) {
      fieldComparisons.amount = {
        field: 'depositAmountPaise',
        submittedValue: subPaise,
        bankValue: null,
        outcome: COMPARISON_OUTCOME.MISSING_IN_BANK_RESPONSE,
      };
    } else if (subPaise === bankPaise) {
      fieldComparisons.amount = {
        field: 'depositAmountPaise',
        submittedValue: subPaise,
        bankValue: bankPaise,
        outcome: COMPARISON_OUTCOME.MATCH,
        differencePaise: 0,
        explanation: 'Principal deposit amount matches exactly in integer paise.',
      };
    } else {
      const diff = subPaise - bankPaise;
      fieldComparisons.amount = {
        field: 'depositAmountPaise',
        submittedValue: subPaise,
        bankValue: bankPaise,
        outcome: COMPARISON_OUTCOME.MISMATCH,
        differencePaise: diff,
        explanation: `Amount discrepancy: Submitted ₹${(subPaise / 100).toLocaleString('en-IN')} vs Bank Reported ₹${(bankPaise / 100).toLocaleString('en-IN')}`,
      };
      findings.push(COMPARISON_FINDINGS.SIMULATED_AMOUNT_MISMATCH);
    }

    // 3. Deposit Date
    const normSubDepDate = normalizeDate(submitted?.depositDate);
    const normBankDepDate = normalizeDate(bankResponse.bankReportedDepositDate);
    if (!normBankDepDate) {
      fieldComparisons.depositDate = {
        field: 'depositDate',
        submittedValue: submitted?.depositDate,
        bankValue: null,
        outcome: COMPARISON_OUTCOME.MISSING_IN_BANK_RESPONSE,
      };
    } else if (normSubDepDate === normBankDepDate) {
      fieldComparisons.depositDate = {
        field: 'depositDate',
        submittedValue: submitted?.depositDate,
        bankValue: bankResponse.bankReportedDepositDate,
        outcome: COMPARISON_OUTCOME.MATCH,
        explanation: 'Deposit issue date matches.',
      };
    } else {
      fieldComparisons.depositDate = {
        field: 'depositDate',
        submittedValue: submitted?.depositDate,
        bankValue: bankResponse.bankReportedDepositDate,
        outcome: COMPARISON_OUTCOME.MISMATCH,
        explanation: `Issue date mismatch: Submitted ${normSubDepDate} vs Bank Reported ${normBankDepDate}`,
      };
      findings.push(COMPARISON_FINDINGS.SIMULATED_DEPOSIT_DATE_MISMATCH);
    }

    // 4. Maturity Date
    const normSubMatDate = normalizeDate(submitted?.maturityDate);
    const normBankMatDate = normalizeDate(bankResponse.bankReportedMaturityDate);
    if (!normBankMatDate) {
      fieldComparisons.maturityDate = {
        field: 'maturityDate',
        submittedValue: submitted?.maturityDate,
        bankValue: null,
        outcome: COMPARISON_OUTCOME.MISSING_IN_BANK_RESPONSE,
      };
    } else if (normSubMatDate === normBankMatDate) {
      fieldComparisons.maturityDate = {
        field: 'maturityDate',
        submittedValue: submitted?.maturityDate,
        bankValue: bankResponse.bankReportedMaturityDate,
        outcome: COMPARISON_OUTCOME.MATCH,
        explanation: 'Maturity date matches synthetic bank ledger.',
      };
    } else {
      fieldComparisons.maturityDate = {
        field: 'maturityDate',
        submittedValue: submitted?.maturityDate,
        bankValue: bankResponse.bankReportedMaturityDate,
        outcome: COMPARISON_OUTCOME.MISMATCH,
        explanation: `Maturity date mismatch: Submitted ${normSubMatDate} vs Bank Reported ${normBankMatDate}`,
      };
      findings.push(COMPARISON_FINDINGS.SIMULATED_MATURITY_MISMATCH);
    }

    // 5. Account Holder
    const normSubHolder = normalizeString(submitted?.accountHolderName);
    const normBankHolder = normalizeString(bankResponse.bankReportedAccountHolder);
    if (!normBankHolder) {
      fieldComparisons.accountHolder = {
        field: 'accountHolder',
        submittedValue: submitted?.accountHolderName,
        bankValue: null,
        outcome: COMPARISON_OUTCOME.MISSING_IN_BANK_RESPONSE,
      };
    } else if (
      normSubHolder === normBankHolder ||
      (normSubHolder && normBankHolder && (normSubHolder.includes(normBankHolder) || normBankHolder.includes(normSubHolder)))
    ) {
      fieldComparisons.accountHolder = {
        field: 'accountHolder',
        submittedValue: submitted?.accountHolderName,
        bankValue: bankResponse.bankReportedAccountHolder,
        outcome: COMPARISON_OUTCOME.MATCH,
        explanation: 'Account holder title matches synthetic record.',
      };
    } else {
      fieldComparisons.accountHolder = {
        field: 'accountHolder',
        submittedValue: submitted?.accountHolderName,
        bankValue: bankResponse.bankReportedAccountHolder,
        outcome: COMPARISON_OUTCOME.MISMATCH,
        explanation: `Account holder differs: Submitted "${submitted?.accountHolderName}" vs Bank "${bankResponse.bankReportedAccountHolder}"`,
      };
      findings.push(COMPARISON_FINDINGS.SIMULATED_ACCOUNT_HOLDER_MISMATCH);
    }

    // 6. Lien Status Checks
    if (bankResponse.lienStatus === 'LIEN_NOT_RECORDED_IN_SIMULATION') {
      fieldComparisons.lien = {
        field: 'lienStatus',
        submittedValue: submitted?.applicableSecurityRequirement || 'Lien Required',
        bankValue: 'LIEN_NOT_RECORDED',
        outcome: COMPARISON_OUTCOME.MISMATCH,
        explanation: 'No lien is registered on this instrument in the synthetic bank ledger.',
      };
      findings.push(COMPARISON_FINDINGS.SIMULATED_LIEN_MISSING);
    } else if (bankResponse.lienStatus === 'BENEFICIARY_MISMATCH_IN_SIMULATION') {
      fieldComparisons.lien = {
        field: 'lienStatus',
        submittedValue: 'All India Council for Technical Education (AICTE)',
        bankValue: bankResponse.lienBeneficiary,
        outcome: COMPARISON_OUTCOME.MISMATCH,
        explanation: `Lien is registered, but beneficiary "${bankResponse.lienBeneficiary}" does not match regulatory authority.`,
      };
      findings.push(COMPARISON_FINDINGS.SIMULATED_LIEN_BENEFICIARY_MISMATCH);
    } else if (bankResponse.lienStatus === 'LIEN_RECORDED_IN_SIMULATION') {
      fieldComparisons.lien = {
        field: 'lienStatus',
        submittedValue: 'Lien in favor of Regulatory Authority',
        bankValue: bankResponse.lienBeneficiary,
        outcome: COMPARISON_OUTCOME.MATCH,
        explanation: `Lien confirmed in favor of ${bankResponse.lienBeneficiary} (Ref: ${bankResponse.lienReference || 'N/A'}).`,
      };
    } else {
      fieldComparisons.lien = {
        field: 'lienStatus',
        submittedValue: 'Lien in favor of Regulatory Authority',
        bankValue: 'UNKNOWN',
        outcome: COMPARISON_OUTCOME.INDETERMINATE,
        explanation: 'Lien status could not be established from bank simulator.',
      };
    }

    // Determine Overall Outcome
    const hasMismatches = Object.values(fieldComparisons).some(
      (c) => c.outcome === COMPARISON_OUTCOME.MISMATCH
    );
    const hasIndeterminate = Object.values(fieldComparisons).some(
      (c) => c.outcome === COMPARISON_OUTCOME.INDETERMINATE || c.outcome === COMPARISON_OUTCOME.MISSING_IN_BANK_RESPONSE
    );

    let overallOutcome = COMPARISON_OUTCOME.MATCH;
    if (hasMismatches) {
      overallOutcome = COMPARISON_OUTCOME.MISMATCH;
    } else if (hasIndeterminate) {
      overallOutcome = COMPARISON_OUTCOME.INDETERMINATE;
    } else {
      findings.push(COMPARISON_FINDINGS.SIMULATED_DEPOSIT_MATCH);
    }

    return {
      overallOutcome,
      findings,
      fieldComparisons,
      summaryText:
        overallOutcome === COMPARISON_OUTCOME.MATCH
          ? 'All submitted FDR details and lien records are consistent with synthetic bank ledger.'
          : overallOutcome === COMPARISON_OUTCOME.MISMATCH
          ? `Discrepancies identified between submitted FDR and synthetic bank ledger (${findings.length} findings).`
          : 'Verification outcome is indeterminate due to missing or unconfirmed fields.',
    };
  },
};
