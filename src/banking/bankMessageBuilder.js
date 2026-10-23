/**
 * NidhiSetu Banking Simulator — Structured Financial Message Builder
 * Constructs structured client-side mock financial messages for deposit confirmation and lien inquiries.
 *
 * NOTE: STRICTLY INTERNAL MOCK MESSAGING.
 * Not real SFMS, ISO 20022, or SWIFT network messages.
 */

import {
  MESSAGE_TYPES,
  SCHEMA_VERSION,
  VALIDATION_STATUS,
  SIMULATION_DISCLAIMER,
  validateMockMessage,
  generateUUID,
} from './bankMessageSchema';

export const bankMessageBuilder = {
  /**
   * Builds a structured FDR verification inquiry request message
   */
  buildFdrVerifyRequest({
    requestId,
    correlationId = generateUUID(),
    simulatorBankId,
    fdrNumber,
    declaredAmountPaise,
    depositDate,
    maturityDate,
    accountHolderName,
    verificationTypes = ['FDR_EXISTENCE_CHECK', 'DEPOSIT_DETAILS_CHECK', 'LIEN_STATUS_CHECK'],
    officerReason = 'Statutory FDR & Lien Scrutiny',
    officerId = 'usr-officer-system',
  }) {
    const message = {
      messageId: `MSG-REQ-${generateUUID().substring(0, 8).toUpperCase()}`,
      correlationId,
      requestId,
      messageType: MESSAGE_TYPES.MOCK_FDR_VERIFY_REQUEST,
      senderSimulatorId: 'NIDHISETU_REGULATORY_NODE',
      recipientSystemId: simulatorBankId || 'SYNTHETIC_BANK_NODE',
      createdAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION,
      simulationMode: true,
      disclaimer: SIMULATION_DISCLAIMER,
      payload: {
        fdrNumber: fdrNumber || '',
        declaredAmountPaise: Number(declaredAmountPaise) || 0,
        depositDate: depositDate || null,
        maturityDate: maturityDate || null,
        accountHolderName: accountHolderName || '',
        verificationTypes,
        officerReason,
        officerId,
      },
    };

    const validation = validateMockMessage(message);
    message.validationStatus = validation.isValid
      ? VALIDATION_STATUS.VALID
      : VALIDATION_STATUS.INVALID;
    message.validationErrors = validation.errors;

    return message;
  },

  /**
   * Builds a structured FDR verification confirmation response message
   */
  buildFdrVerifyResponse({
    requestId,
    correlationId,
    simulatorBankId,
    scenarioId,
    responsePayload,
    isMalformed = false,
  }) {
    const message = {
      messageId: `MSG-RESP-${generateUUID().substring(0, 8).toUpperCase()}`,
      correlationId: correlationId || generateUUID(),
      requestId,
      messageType: MESSAGE_TYPES.MOCK_FDR_VERIFY_RESPONSE,
      senderSimulatorId: simulatorBankId || 'SYNTHETIC_BANK_NODE',
      recipientSystemId: 'NIDHISETU_REGULATORY_NODE',
      createdAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION,
      simulationMode: true,
      disclaimer: SIMULATION_DISCLAIMER,
      payload: isMalformed
        ? {
            // Deliberately malformed payload missing mandatory attributes
            corruptedDataField: 'ERROR_0xDEADBEEF',
            rawSnippet: 'MALFORMED_SIMULATOR_OUTPUT',
          }
        : {
            scenarioId,
            depositExistenceStatus: responsePayload.depositExistenceStatus,
            bankReportedFdrNumber: responsePayload.bankReportedFdrNumber,
            bankReportedAmountPaise: responsePayload.bankReportedAmountPaise,
            bankReportedDepositDate: responsePayload.bankReportedDepositDate,
            bankReportedMaturityDate: responsePayload.bankReportedMaturityDate,
            bankReportedAccountHolder: responsePayload.bankReportedAccountHolder,
            lienStatus: responsePayload.lienStatus,
            lienBeneficiary: responsePayload.lienBeneficiary,
            lienReference: responsePayload.lienReference,
            coreBankingRef: responsePayload.coreBankingRef,
            branchIfsc: responsePayload.branchIfsc,
            simulationNotice: SIMULATION_DISCLAIMER,
            errors: responsePayload.errors || [],
            warnings: responsePayload.warnings || [],
          },
    };

    const validation = validateMockMessage(message);
    message.validationStatus = validation.isValid
      ? VALIDATION_STATUS.VALID
      : VALIDATION_STATUS.INVALID;
    message.validationErrors = validation.errors;

    return message;
  },

  /**
   * Builds a structured Lien status inquiry request message
   */
  buildLienStatusRequest({
    requestId,
    correlationId = generateUUID(),
    simulatorBankId,
    fdrNumber,
    expectedBeneficiary = 'All India Council for Technical Education (AICTE)',
  }) {
    const message = {
      messageId: `MSG-LIEN-REQ-${generateUUID().substring(0, 8).toUpperCase()}`,
      correlationId,
      requestId,
      messageType: MESSAGE_TYPES.MOCK_LIEN_STATUS_REQUEST,
      senderSimulatorId: 'NIDHISETU_REGULATORY_NODE',
      recipientSystemId: simulatorBankId || 'SYNTHETIC_BANK_NODE',
      createdAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION,
      simulationMode: true,
      disclaimer: SIMULATION_DISCLAIMER,
      payload: {
        fdrNumber,
        expectedBeneficiary,
      },
    };

    const validation = validateMockMessage(message);
    message.validationStatus = validation.isValid
      ? VALIDATION_STATUS.VALID
      : VALIDATION_STATUS.INVALID;
    message.validationErrors = validation.errors;

    return message;
  },

  /**
   * Builds a structured Lien status response message
   */
  buildLienStatusResponse({
    requestId,
    correlationId,
    simulatorBankId,
    lienStatus,
    lienBeneficiary,
    lienReference,
  }) {
    const message = {
      messageId: `MSG-LIEN-RESP-${generateUUID().substring(0, 8).toUpperCase()}`,
      correlationId: correlationId || generateUUID(),
      requestId,
      messageType: MESSAGE_TYPES.MOCK_LIEN_STATUS_RESPONSE,
      senderSimulatorId: simulatorBankId || 'SYNTHETIC_BANK_NODE',
      recipientSystemId: 'NIDHISETU_REGULATORY_NODE',
      createdAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION,
      simulationMode: true,
      disclaimer: SIMULATION_DISCLAIMER,
      payload: {
        lienStatus,
        lienBeneficiary,
        lienReference,
      },
    };

    const validation = validateMockMessage(message);
    message.validationStatus = validation.isValid
      ? VALIDATION_STATUS.VALID
      : VALIDATION_STATUS.INVALID;
    message.validationErrors = validation.errors;

    return message;
  },
};
