/**
 * NidhiSetu Bank Simulation Evidence Adapter
 * Consumes Module 05 simulated bank verification outcomes WITHOUT mutating Module 05 states.
 *
 * CRITICAL COMPLIANCE NOTICE:
 * All findings produced by this adapter are explicitly tagged SIMULATED.
 * They represent simulated responses from the synthetic test harness and
 * MUST NEVER be portrayed as genuine, external, or statutory bank verification.
 */

import { bankVerificationRepository, REQUEST_STATUS } from '../storage/bankVerificationRepository';
import { SIMULATED_BANK_DISCLAIMER } from './complianceDemoFixtures';

export const BANK_SIMULATION_SIGNALS = {
  SIMULATED_EXACT_MATCH: 'SIMULATED_EXACT_MATCH',
  SIMULATED_AMOUNT_MISMATCH: 'SIMULATED_AMOUNT_MISMATCH',
  SIMULATED_FDR_NOT_FOUND: 'SIMULATED_FDR_NOT_FOUND',
  SIMULATED_LIEN_MISSING: 'SIMULATED_LIEN_MISSING',
  SIMULATED_BENEFICIARY_MISMATCH: 'SIMULATED_BENEFICIARY_MISMATCH',
  SIMULATED_MATURITY_MISMATCH: 'SIMULATED_MATURITY_MISMATCH',
  SIMULATED_RESPONSE_TIMEOUT: 'SIMULATED_RESPONSE_TIMEOUT',
  SIMULATED_MALFORMED_RESPONSE: 'SIMULATED_MALFORMED_RESPONSE',
  SIMULATED_FOLLOW_UP_REQUESTED: 'SIMULATED_FOLLOW_UP_REQUESTED',
  NOT_SIMULATED: 'NOT_SIMULATED',
  SIMULATION_FAILED: 'SIMULATION_FAILED',
};

/**
 * Extracts simulated bank verification evidence for an FDR.
 *
 * @param {Object} fdr - FDR record
 * @returns {Promise<Object>} Simulated bank evidence object
 */
export async function extractBankEvidenceForFdr(fdr) {
  if (!fdr || !fdr.id) {
    return {
      fdrId: null,
      status: BANK_SIMULATION_SIGNALS.NOT_SIMULATED,
      findings: [],
      disclaimer: SIMULATED_BANK_DISCLAIMER,
    };
  }

  const fdrId = String(fdr.id || fdr.fdrId);
  const latestRequest = await bankVerificationRepository.getLatestRequestForFdr(fdrId);

  if (!latestRequest) {
    return {
      fdrId,
      fdrNumber: fdr.fdrNumber,
      status: BANK_SIMULATION_SIGNALS.NOT_SIMULATED,
      explanation: 'No synthetic bank verification has been executed for this deposit.',
      findings: [],
      disclaimer: SIMULATED_BANK_DISCLAIMER,
    };
  }

  if (latestRequest.requestStatus === REQUEST_STATUS.RESPONSE_FAILED) {
    return {
      fdrId,
      fdrNumber: fdr.fdrNumber,
      requestId: latestRequest.requestId,
      requestReference: latestRequest.requestReference,
      status: BANK_SIMULATION_SIGNALS.SIMULATION_FAILED,
      explanation: `Simulated bank communication failed: ${latestRequest.failureReason || 'Simulated gateway error'}.`,
      findings: [
        {
          signalId: `SIM-FAIL-${latestRequest.requestId}`,
          signalType: BANK_SIMULATION_SIGNALS.SIMULATION_FAILED,
          severity: 'MEDIUM',
          isSimulated: true,
          explanation: `Simulated bank query failed (${latestRequest.failureReason || 'Timeout'}).`,
          recommendedAction: 'Re-trigger synthetic bank verification or examine mock logs.',
        },
      ],
      disclaimer: SIMULATED_BANK_DISCLAIMER,
      dossierLink: `/officer/bank-verifications/${latestRequest.requestId}`,
    };
  }

  const findings = [];
  const comp = latestRequest.comparisonResults || {};
  const scenario = latestRequest.scenarioId || 'SIMULATED_UNKNOWN';

  // Check 1: Existence / Not Found
  if (comp.fdrExists === false) {
    findings.push({
      signalId: `SIM-${latestRequest.requestId}-NOT-FOUND`,
      signalType: BANK_SIMULATION_SIGNALS.SIMULATED_FDR_NOT_FOUND,
      severity: 'HIGH',
      isSimulated: true,
      explanation: `Simulated bank response indicates FDR #${fdr.fdrNumber} was not found in synthetic CBS ledger (Scenario: ${scenario}).`,
      recommendedAction: 'Officer review required — request simulated branch confirmation.',
    });
  }

  // Check 2: Amount Mismatch
  if (comp.amountMatches === false) {
    findings.push({
      signalId: `SIM-${latestRequest.requestId}-AMOUNT-MISMATCH`,
      signalType: BANK_SIMULATION_SIGNALS.SIMULATED_AMOUNT_MISMATCH,
      severity: 'HIGH',
      isSimulated: true,
      explanation: `Simulated bank response reports amount variance: Declared ₹${(fdr.amountPaise ? fdr.amountPaise / 100 : fdr.amount || 0).toLocaleString('en-IN')} vs Bank CBS ₹${((comp.bankAmountPaise || 0) / 100).toLocaleString('en-IN')} (Scenario: ${scenario}).`,
      recommendedAction: 'Verify physical deposit receipt and seek bank clarification in prototype.',
    });
  }

  // Check 3: Lien Missing
  if (comp.lienMarked === false) {
    findings.push({
      signalId: `SIM-${latestRequest.requestId}-LIEN-MISSING`,
      signalType: BANK_SIMULATION_SIGNALS.SIMULATED_LIEN_MISSING,
      severity: 'HIGH',
      isSimulated: true,
      explanation: `Simulated bank response indicates no lien is marked in favor of the regulatory authority (Scenario: ${scenario}).`,
      recommendedAction: 'Request institution submit formal lien endorsement certificate.',
    });
  }

  // Check 4: Beneficiary Mismatch
  if (comp.beneficiaryMatches === false) {
    findings.push({
      signalId: `SIM-${latestRequest.requestId}-BENEFICIARY-MISMATCH`,
      signalType: BANK_SIMULATION_SIGNALS.SIMULATED_BENEFICIARY_MISMATCH,
      severity: 'MEDIUM',
      isSimulated: true,
      explanation: `Simulated lien beneficiary does not match required authority designation (Scenario: ${scenario}).`,
      recommendedAction: 'Check lien annotation with issuing bank simulator.',
    });
  }

  // Check 5: Maturity Mismatch
  if (comp.maturityMatches === false) {
    findings.push({
      signalId: `SIM-${latestRequest.requestId}-MATURITY-MISMATCH`,
      signalType: BANK_SIMULATION_SIGNALS.SIMULATED_MATURITY_MISMATCH,
      severity: 'MEDIUM',
      isSimulated: true,
      explanation: `Simulated bank CBS maturity date differs from declared date (Scenario: ${scenario}).`,
      recommendedAction: 'Reconcile maturity schedule against simulated CBS ledger.',
    });
  }

  // If no negative findings, exact match
  if (findings.length === 0 && comp.overallMatchStatus === 'EXACT_MATCH') {
    findings.push({
      signalId: `SIM-${latestRequest.requestId}-MATCH`,
      signalType: BANK_SIMULATION_SIGNALS.SIMULATED_EXACT_MATCH,
      severity: 'INFORMATIONAL',
      isSimulated: true,
      explanation: `Synthetic CBS query returned exact match across all deposit parameters (Scenario: ${scenario}).`,
      recommendedAction: 'No immediate simulated follow-up required.',
    });
  }

  return {
    fdrId,
    fdrNumber: fdr.fdrNumber,
    requestId: latestRequest.requestId,
    requestReference: latestRequest.requestReference,
    bankName: latestRequest.bankName,
    simulatorBankId: latestRequest.simulatorBankId,
    scenarioId: scenario,
    status: findings.length > 0 ? 'SIMULATED_EVIDENCE_AVAILABLE' : 'SIMULATED_NO_DISCREPANCIES',
    findings,
    disclaimer: SIMULATED_BANK_DISCLAIMER,
    dossierLink: `/officer/bank-verifications/${latestRequest.requestId}`,
    simulatedAt: latestRequest.responseReceivedAt || latestRequest.updatedAt,
  };
}

/**
 * Extracts bank simulation evidence across all given FDRs.
 */
export async function extractAllBankEvidence(fdrRecords = []) {
  const results = await Promise.all(fdrRecords.map((fdr) => extractBankEvidenceForFdr(fdr)));
  const allFindings = [];
  results.forEach((r) => {
    if (r.findings && r.findings.length > 0) {
      allFindings.push(...r.findings);
    }
  });
  return {
    adapterResults: results,
    allFindings,
  };
}
