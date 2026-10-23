/**
 * NidhiSetu Banking Simulator — Bank Response Validator
 * Validates simulated bank response models and integrity before persistence.
 */

export const DEPOSIT_EXISTENCE_STATUS = {
  FOUND_IN_SYNTHETIC_LEDGER: 'FOUND_IN_SYNTHETIC_LEDGER',
  NOT_FOUND_IN_SYNTHETIC_LEDGER: 'NOT_FOUND_IN_SYNTHETIC_LEDGER',
  INDETERMINATE: 'INDETERMINATE',
};

export const BANK_LIEN_STATUS = {
  LIEN_RECORDED_IN_SIMULATION: 'LIEN_RECORDED_IN_SIMULATION',
  LIEN_NOT_RECORDED_IN_SIMULATION: 'LIEN_NOT_RECORDED_IN_SIMULATION',
  BENEFICIARY_MISMATCH_IN_SIMULATION: 'BENEFICIARY_MISMATCH_IN_SIMULATION',
  UNKNOWN: 'UNKNOWN',
};

export const bankResponseValidator = {
  /**
   * Validates a simulated bank response object
   * @param {Object} response
   * @returns {Object} { isValid: boolean, errors: Array<string> }
   */
  validateResponse(response) {
    const errors = [];

    if (!response || typeof response !== 'object') {
      return { isValid: false, errors: ['Response must be an object'] };
    }

    if (!response.responseId) errors.push('Missing responseId');
    if (!response.requestId) errors.push('Missing requestId');
    if (!response.simulatorBankId) errors.push('Missing simulatorBankId');
    if (response.simulationMode !== true) {
      errors.push('simulationMode must be strictly true');
    }
    if (!response.scenarioId) errors.push('Missing scenarioId');

    // Deposit existence status validation
    const validExistence = Object.values(DEPOSIT_EXISTENCE_STATUS);
    if (!validExistence.includes(response.depositExistenceStatus)) {
      errors.push(`Invalid depositExistenceStatus: ${response.depositExistenceStatus}`);
    }

    // Lien status validation
    const validLien = Object.values(BANK_LIEN_STATUS);
    if (response.lienStatus && !validLien.includes(response.lienStatus)) {
      errors.push(`Invalid lienStatus: ${response.lienStatus}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};
