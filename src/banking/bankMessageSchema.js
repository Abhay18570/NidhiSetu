/**
 * NidhiSetu Banking Simulator — Structured Financial Message Schema
 * Formal definitions for internal mock financial messages modeled on institutional confirmation protocols.
 *
 * NOTE: STRICTLY INTERNAL MOCK MESSAGING SCHEMA.
 * Not an official SFMS, SWIFT, or RBI ISO 20022 implementation.
 */

export const SIMULATION_DISCLAIMER =
  'SIMULATED BANK RESPONSE — NOT A REAL BANK CONFIRMATION';

export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const MESSAGE_TYPES = {
  MOCK_FDR_VERIFY_REQUEST: 'MOCK_FDR_VERIFY_REQUEST',
  MOCK_FDR_VERIFY_RESPONSE: 'MOCK_FDR_VERIFY_RESPONSE',
  MOCK_LIEN_STATUS_REQUEST: 'MOCK_LIEN_STATUS_REQUEST',
  MOCK_LIEN_STATUS_RESPONSE: 'MOCK_LIEN_STATUS_RESPONSE',
};

export const SCHEMA_VERSION = '1.0.0-MOCK-SFMS';

export const VALIDATION_STATUS = {
  VALID: 'VALID',
  INVALID: 'INVALID',
  PENDING: 'PENDING',
};

/**
 * Validates a simulated financial message against internal schema rules.
 *
 * @param {Object} message - The mock message object
 * @returns {Object} { isValid: boolean, errors: Array<string> }
 */
export function validateMockMessage(message) {
  const errors = [];

  if (!message || typeof message !== 'object') {
    return { isValid: false, errors: ['Message must be a non-null object.'] };
  }

  // Required root attributes
  if (!message.messageId) errors.push('Missing mandatory attribute: messageId');
  if (!message.correlationId) errors.push('Missing mandatory attribute: correlationId');
  if (!message.requestId) errors.push('Missing mandatory attribute: requestId');
  if (!message.messageType || !MESSAGE_TYPES[message.messageType]) {
    errors.push(`Invalid or missing messageType: ${message.messageType}`);
  }
  if (!message.senderSimulatorId) errors.push('Missing senderSimulatorId');
  if (!message.recipientSystemId) errors.push('Missing recipientSystemId');
  if (!message.createdAt) errors.push('Missing createdAt timestamp');
  if (message.simulationMode !== true) {
    errors.push('simulationMode flag must be strictly set to true');
  }

  // Validate payload
  if (!message.payload || typeof message.payload !== 'object') {
    errors.push('Missing payload object in message structure');
  } else {
    // Specific payload validations by message type
    if (message.messageType === MESSAGE_TYPES.MOCK_FDR_VERIFY_REQUEST) {
      if (!message.payload.fdrNumber) errors.push('Payload missing fdrNumber');
      if (!message.payload.declaredAmountPaise) errors.push('Payload missing declaredAmountPaise');
    }

    if (message.messageType === MESSAGE_TYPES.MOCK_FDR_VERIFY_RESPONSE) {
      if (!message.payload.scenarioId) errors.push('Response payload missing scenarioId');
      if (!message.payload.depositExistenceStatus) errors.push('Response payload missing depositExistenceStatus');
      if (!message.payload.lienStatus) errors.push('Response payload missing lienStatus');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
