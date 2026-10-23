/**
 * NidhiSetu Banking Simulator — Lien Status Engine
 * Evaluates regulatory lien marking status, beneficiary matching, and security deposit encumbrance.
 *
 * NOTE: SIMULATION ONLY.
 * No real lien creation or release operations are executed.
 */

export const LIEN_EVALUATION_OUTCOME = {
  MATCHED_IN_SIMULATION: 'MATCHED_IN_SIMULATION',
  NOT_RECORDED_IN_SIMULATION: 'NOT_RECORDED_IN_SIMULATION',
  BENEFICIARY_MISMATCH_IN_SIMULATION: 'BENEFICIARY_MISMATCH_IN_SIMULATION',
  INDETERMINATE: 'INDETERMINATE',
};

export const lienStatusEngine = {
  /**
   * Resolves expected regulatory beneficiary based on FDR configuration or institution jurisdiction
   * @param {Object} fdrRecord
   * @returns {string|null} Expected beneficiary title
   */
  resolveExpectedBeneficiary(fdrRecord) {
    if (!fdrRecord) return null;

    if (fdrRecord.expectedLienBeneficiary) {
      return fdrRecord.expectedLienBeneficiary;
    }

    // Derive from applicable security requirement or regional notes
    const req = fdrRecord.applicableSecurityRequirement || '';
    if (req.toLowerCase().includes('aicte') || req.toLowerCase().includes('technical')) {
      return 'All India Council for Technical Education (AICTE)';
    }

    if (fdrRecord.accountHolderName && fdrRecord.accountHolderName.toLowerCase().includes('aicte')) {
      return 'All India Council for Technical Education (AICTE)';
    }

    // Default regulatory beneficiary for SIH / AICTE context
    return 'All India Council for Technical Education (AICTE)';
  },

  /**
   * Evaluates the synthetic bank response lien status against expected regulatory requirements
   *
   * @param {Object} fdrRecord - Submitted FDR record
   * @param {Object} bankResponse - Simulated bank response
   * @returns {Object} Lien verification evaluation
   */
  evaluateLienStatus(fdrRecord, bankResponse) {
    const timestamp = new Date().toISOString();
    const expectedBeneficiary = this.resolveExpectedBeneficiary(fdrRecord);

    if (!bankResponse) {
      return {
        outcome: LIEN_EVALUATION_OUTCOME.INDETERMINATE,
        expectedBeneficiary,
        reportedBeneficiary: null,
        lienReference: null,
        isLienValid: false,
        lastCheckedTimestamp: timestamp,
        explanation: 'No simulated bank response available to evaluate lien status.',
      };
    }

    const { lienStatus, lienBeneficiary, lienReference } = bankResponse;

    if (lienStatus === 'LIEN_NOT_RECORDED_IN_SIMULATION') {
      return {
        outcome: LIEN_EVALUATION_OUTCOME.NOT_RECORDED_IN_SIMULATION,
        expectedBeneficiary,
        reportedBeneficiary: null,
        lienReference: null,
        isLienValid: false,
        lastCheckedTimestamp: timestamp,
        explanation: 'The synthetic bank ledger confirms no lien is marked on this instrument.',
      };
    }

    if (lienStatus === 'BENEFICIARY_MISMATCH_IN_SIMULATION') {
      return {
        outcome: LIEN_EVALUATION_OUTCOME.BENEFICIARY_MISMATCH_IN_SIMULATION,
        expectedBeneficiary,
        reportedBeneficiary: lienBeneficiary,
        lienReference: lienReference || null,
        isLienValid: false,
        lastCheckedTimestamp: timestamp,
        explanation: `Lien is marked, but beneficiary is "${lienBeneficiary}" instead of required "${expectedBeneficiary}".`,
      };
    }

    if (lienStatus === 'LIEN_RECORDED_IN_SIMULATION') {
      // Check if expectedBeneficiary is specified and matches or contains relevant regulatory keywords
      if (!expectedBeneficiary) {
        return {
          outcome: LIEN_EVALUATION_OUTCOME.INDETERMINATE,
          expectedBeneficiary: null,
          reportedBeneficiary: lienBeneficiary,
          lienReference: lienReference || null,
          isLienValid: false,
          lastCheckedTimestamp: timestamp,
          explanation: 'Lien recorded in simulation, but expected regulatory beneficiary is undefined.',
        };
      }

      const normExpected = expectedBeneficiary.toLowerCase();
      const normReported = (lienBeneficiary || '').toLowerCase();

      const isMatch =
        normReported.includes(normExpected) ||
        normExpected.includes(normReported) ||
        (normExpected.includes('aicte') && normReported.includes('aicte'));

      if (isMatch) {
        return {
          outcome: LIEN_EVALUATION_OUTCOME.MATCHED_IN_SIMULATION,
          expectedBeneficiary,
          reportedBeneficiary: lienBeneficiary,
          lienReference: lienReference || null,
          isLienValid: true,
          lastCheckedTimestamp: timestamp,
          explanation: `Lien confirmed in favor of ${lienBeneficiary}. Reference: ${lienReference || 'N/A'}.`,
        };
      } else {
        return {
          outcome: LIEN_EVALUATION_OUTCOME.BENEFICIARY_MISMATCH_IN_SIMULATION,
          expectedBeneficiary,
          reportedBeneficiary: lienBeneficiary,
          lienReference: lienReference || null,
          isLienValid: false,
          lastCheckedTimestamp: timestamp,
          explanation: `Lien beneficiary mismatch: Expected "${expectedBeneficiary}", but bank reports "${lienBeneficiary}".`,
        };
      }
    }

    return {
      outcome: LIEN_EVALUATION_OUTCOME.INDETERMINATE,
      expectedBeneficiary,
      reportedBeneficiary: lienBeneficiary || null,
      lienReference: lienReference || null,
      isLienValid: false,
      lastCheckedTimestamp: timestamp,
      explanation: 'Lien status in simulated response is unknown or indeterminate.',
    };
  },
};
