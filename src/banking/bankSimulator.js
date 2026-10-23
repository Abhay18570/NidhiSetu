/**
 * NidhiSetu Banking Simulator — Core Deterministic Simulation Engine
 * Simulates commercial bank confirmation responses, SFMS-styled mock messages, and ledger lookups.
 *
 * NOTE: PURELY CLIENT-SIDE SYNTHETIC SIMULATOR.
 * No real bank APIs or external network calls are performed.
 */

import {
  SIMULATION_SCENARIOS,
  SYNTHETIC_BANK_LEDGER_FIXTURES,
} from './bankScenarioFixtures';
import { bankMessageBuilder } from './bankMessageBuilder';
import { SIMULATION_DISCLAIMER, generateUUID } from './bankMessageSchema';

export const bankSimulator = {
  /**
   * Finds a synthetic ledger record for an FDR number or bank code
   */
  findLedgerRecord(fdrNumber, simulatorBankId) {
    if (!fdrNumber) return null;
    const cleanFdr = String(fdrNumber).trim().toUpperCase();

    // Direct match
    let match = SYNTHETIC_BANK_LEDGER_FIXTURES.find(
      (l) => l.fdrNumber.toUpperCase() === cleanFdr
    );

    // Or bank-specific match
    if (!match && simulatorBankId) {
      match = SYNTHETIC_BANK_LEDGER_FIXTURES.find(
        (l) => l.simulatorBankId === simulatorBankId
      );
    }

    return match || SYNTHETIC_BANK_LEDGER_FIXTURES[0];
  },

  /**
   * Executes a deterministic simulation for a verification request and scenario.
   *
   * @param {Object} verificationRequest
   * @param {string} scenarioId - Scenario identifier from SIMULATION_SCENARIOS
   * @param {Object} options - { delayMs, skipDelay }
   * @returns {Promise<Object>} { response, responseMessage, requestMessage }
   */
  async executeSimulation(verificationRequest, scenarioId = 'SCENARIO_A_EXACT_MATCH', options = {}) {
    const correlationId = verificationRequest.correlationId || generateUUID();
    const requestId = verificationRequest.requestId;
    const simulatorBankId = verificationRequest.simulatorBankId || 'sim-bank-sbi';
    const fdrNumber = verificationRequest.fdrNumber;
    const declaredPaise = Number(verificationRequest.declaredAmountPaise) || 350000000;
    const depositDate = verificationRequest.depositDate || '2024-08-15';
    const maturityDate = verificationRequest.maturityDate || '2027-08-15';
    const accountHolderName =
      verificationRequest.accountHolderName || 'Principal, College of Engineering Pune Jointly with AICTE';

    // 1. Build Mock Request Message
    const requestMessage = bankMessageBuilder.buildFdrVerifyRequest({
      requestId,
      correlationId,
      simulatorBankId,
      fdrNumber,
      declaredAmountPaise: declaredPaise,
      depositDate,
      maturityDate,
      accountHolderName,
      verificationTypes: verificationRequest.requestedVerificationTypes,
      officerReason: verificationRequest.officerReason || 'Mandatory regulatory verification',
      officerId: verificationRequest.officerId || 'usr-officer-system',
    });

    // Determine simulation delay
    const delay = options.skipDelay
      ? 0
      : (typeof options.delayMs === 'number' ? options.delayMs : 400);

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // 2. Handle Scenario-specific outcomes
    const ledger = this.findLedgerRecord(fdrNumber, simulatorBankId);

    // Default response template
    const responseId = `RESP-${generateUUID().substring(0, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    let responseStatus = 'SUCCESS';
    let depositExistenceStatus = 'FOUND_IN_SYNTHETIC_LEDGER';
    let bankReportedFdrNumber = fdrNumber;
    let bankReportedAmountPaise = declaredPaise;
    let bankReportedDepositDate = depositDate;
    let bankReportedMaturityDate = maturityDate;
    let bankReportedAccountHolder = accountHolderName;
    let lienStatus = 'LIEN_RECORDED_IN_SIMULATION';
    let lienBeneficiary = 'All India Council for Technical Education (AICTE)';
    let lienReference = `LIEN-MOCK/${simulatorBankId?.replace('sim-bank-', '').toUpperCase()}/2026/${Math.floor(10000 + Math.random() * 90000)}`;
    let errors = [];
    let warnings = [];
    let isMalformed = false;

    switch (scenarioId) {
      case 'SCENARIO_A_EXACT_MATCH':
        // Perfect match
        break;

      case 'SCENARIO_B_AMOUNT_MISMATCH':
        // Amount mismatch: bank ledger reports ₹ 10 Lakhs less (or custom ledger amount)
        bankReportedAmountPaise = declaredPaise > 10000000 ? declaredPaise - 10000000 : declaredPaise + 5000000;
        warnings.push(`Principal amount in synthetic ledger differs from declared amount: ₹${bankReportedAmountPaise / 100}`);
        break;

      case 'SCENARIO_C_FDR_NOT_FOUND':
        depositExistenceStatus = 'NOT_FOUND_IN_SYNTHETIC_LEDGER';
        bankReportedFdrNumber = null;
        bankReportedAmountPaise = null;
        bankReportedDepositDate = null;
        bankReportedMaturityDate = null;
        bankReportedAccountHolder = null;
        lienStatus = 'UNKNOWN';
        lienBeneficiary = null;
        lienReference = null;
        errors.push(`Instrument ${fdrNumber} not found in synthetic bank ledger.`);
        break;

      case 'SCENARIO_D_LIEN_NOT_RECORDED':
        lienStatus = 'LIEN_NOT_RECORDED_IN_SIMULATION';
        lienBeneficiary = null;
        lienReference = null;
        warnings.push('No lien or regulatory encumbrance recorded on this deposit in bank simulation.');
        break;

      case 'SCENARIO_E_BENEFICIARY_MISMATCH':
        lienStatus = 'BENEFICIARY_MISMATCH_IN_SIMULATION';
        lienBeneficiary = 'Local Municipal Corporation / Third Party Contractor';
        warnings.push('Lien registered to a non-regulatory beneficiary entity.');
        break;

      case 'SCENARIO_F_MATURITY_MISMATCH':
        // One year earlier
        try {
          const d = new Date(maturityDate);
          d.setFullYear(d.getFullYear() - 1);
          bankReportedMaturityDate = d.toISOString().split('T')[0];
        } catch {
          bankReportedMaturityDate = '2025-06-30';
        }
        warnings.push('Maturity date reported by synthetic bank differs from submitted tenure.');
        break;

      case 'SCENARIO_G_EXPIRED_DEPOSIT':
        bankReportedMaturityDate = '2024-01-15'; // Definitively in the past
        warnings.push('Deposit instrument has reached maturity and expired in synthetic ledger.');
        break;

      case 'SCENARIO_H_TIMEOUT':
        responseStatus = 'TIMEOUT';
        depositExistenceStatus = 'INDETERMINATE';
        lienStatus = 'UNKNOWN';
        errors.push('Simulated core banking gateway timed out with no response.');
        break;

      case 'SCENARIO_I_MALFORMED_RESPONSE':
        responseStatus = 'MALFORMED';
        isMalformed = true;
        errors.push('Response payload failed internal schema validation.');
        break;

      case 'SCENARIO_J_DUPLICATE_REQUEST':
        responseStatus = 'FAILED';
        errors.push('Duplicate verification request rejected by simulator idempotency guard.');
        break;

      default:
        // Default to exact match
        break;
    }

    const response = {
      responseId,
      requestId,
      correlationId,
      simulatorBankId,
      simulationMode: true,
      sourceType: 'SYNTHETIC_BANK_SIMULATOR',
      scenarioId,
      responseTimestamp: timestamp,
      responseStatus,
      depositExistenceStatus,
      bankReportedFdrNumber,
      bankReportedAmountPaise,
      bankReportedDepositDate,
      bankReportedMaturityDate,
      bankReportedAccountHolder,
      lienStatus,
      lienBeneficiary,
      lienReference,
      coreBankingRef: `CBS-MOCK-${Math.floor(100000 + Math.random() * 900000)}`,
      branchIfsc: ledger?.branchIfsc || 'SBIN0001110',
      disclaimer: SIMULATION_DISCLAIMER,
      errors,
      warnings,
    };

    // 3. Build Mock Response Message
    const responseMessage = bankMessageBuilder.buildFdrVerifyResponse({
      requestId,
      correlationId,
      simulatorBankId,
      scenarioId,
      responsePayload: response,
      isMalformed,
    });

    return {
      response,
      responseMessage,
      requestMessage,
    };
  },
};
