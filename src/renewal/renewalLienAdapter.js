/**
 * NidhiSetu Renewal & Deposit Continuity — Simulated Lien Continuity Adapter
 * Bridges Module 05 banking simulation evidence with Module 07 renewal workflows.
 *
 * CRITICAL REGULATORY & EDUCATIONAL DISCLAIMER:
 * All lien evaluations, bank confirmations, and beneficiary verifications are
 * EXCLUSIVELY SYNTHETIC SIMULATIONS for prototype evaluation and testing.
 * At NO point does this software connect to commercial banking networks,
 * execute live SFMS/CBS transactions, or create/cancel actual bank liens.
 */

import { bankVerificationRepository } from '../storage/bankVerificationRepository';

export const SIMULATED_LIEN_STATUS = {
  SIMULATED_LIEN_CONTINUITY_MATCH: 'SIMULATED_LIEN_CONTINUITY_MATCH',
  SIMULATED_REPLACEMENT_LIEN_MISSING: 'SIMULATED_REPLACEMENT_LIEN_MISSING',
  SIMULATED_BENEFICIARY_MISMATCH: 'SIMULATED_BENEFICIARY_MISMATCH',
  SIMULATION_PENDING: 'SIMULATION_PENDING',
  NOT_SIMULATED: 'NOT_SIMULATED',
  INDETERMINATE: 'INDETERMINATE',
};

export const SIMULATED_LIEN_DISCLAIMER =
  'Simulated Bank Confirmation Data — Purely an educational simulation. No actual bank lien operations performed.';

/**
 * Evaluates simulated lien continuity between original and replacement deposits.
 *
 * @param {string} originalFdrId - Identifier of original FDR
 * @param {Array<string>} replacementFdrIds - Array of replacement FDR IDs
 * @param {string} expectedBeneficiary - Expected regulatory authority (e.g. AICTE)
 */
export async function evaluateSimulatedLienContinuity({
  originalFdrId,
  replacementFdrIds = [],
  expectedBeneficiary = 'All India Council for Technical Education (AICTE)',
}) {
  if (!originalFdrId) {
    return {
      status: SIMULATED_LIEN_STATUS.INDETERMINATE,
      isSimulated: true,
      disclaimer: SIMULATED_LIEN_DISCLAIMER,
      details: 'Original FDR ID is required to evaluate simulated lien continuity.',
    };
  }

  // Fetch simulated requests for original FDR
  const originalReq = await bankVerificationRepository.getLatestRequestForFdr(originalFdrId);

  // If replacement IDs not specified or empty
  if (!replacementFdrIds || replacementFdrIds.length === 0) {
    return {
      status: SIMULATED_LIEN_STATUS.NOT_SIMULATED,
      isSimulated: true,
      disclaimer: SIMULATED_LIEN_DISCLAIMER,
      originalLienStatus: originalReq?.lienMarked ? 'LIEN_CONFIRMED' : 'UNCONFIRMED',
      replacementLienStatus: 'NOT_APPLICABLE',
      details: 'No replacement FDRs specified for lien continuity tracking.',
    };
  }

  // Fetch simulated requests for replacement FDRs
  const replacementReqs = [];
  for (const repId of replacementFdrIds) {
    const repReq = await bankVerificationRepository.getLatestRequestForFdr(repId);
    if (repReq) replacementReqs.push(repReq);
  }

  // If no simulation has been run for replacement FDRs
  if (replacementReqs.length === 0) {
    return {
      status: SIMULATED_LIEN_STATUS.SIMULATED_REPLACEMENT_LIEN_MISSING,
      isSimulated: true,
      disclaimer: SIMULATED_LIEN_DISCLAIMER,
      originalLienStatus: originalReq?.lienMarked ? 'LIEN_CONFIRMED' : 'UNCONFIRMED',
      replacementLienStatus: 'SIMULATION_MISSING',
      details: 'No simulated bank confirmation record exists for the replacement deposit(s). Initiate simulation in Module 05.',
      evidenceCount: 0,
    };
  }

  // Check if any replacement simulation is still processing
  const isPending = replacementReqs.some((r) => r.status === 'PROCESSING' || r.status === 'REQUESTED');
  if (isPending) {
    return {
      status: SIMULATED_LIEN_STATUS.SIMULATION_PENDING,
      isSimulated: true,
      disclaimer: SIMULATED_LIEN_DISCLAIMER,
      originalLienStatus: originalReq?.lienMarked ? 'LIEN_CONFIRMED' : 'UNCONFIRMED',
      replacementLienStatus: 'PENDING_MOCK_CBS',
      details: 'Simulated bank verification is currently in progress for replacement certificate.',
      evidenceCount: replacementReqs.length,
    };
  }

  // Check lien marking on replacements
  const allLienMarked = replacementReqs.every((r) => r.lienMarked === true);
  if (!allLienMarked) {
    return {
      status: SIMULATED_LIEN_STATUS.SIMULATED_REPLACEMENT_LIEN_MISSING,
      isSimulated: true,
      disclaimer: SIMULATED_LIEN_DISCLAIMER,
      originalLienStatus: originalReq?.lienMarked ? 'LIEN_CONFIRMED' : 'UNCONFIRMED',
      replacementLienStatus: 'LIEN_NOT_MARKED',
      details: 'Simulated bank confirmation returned without confirmed lien notation on replacement certificate.',
      evidenceCount: replacementReqs.length,
    };
  }

  // Check beneficiary matching
  const beneficiaryMismatch = replacementReqs.some((r) => {
    if (!r.lienBeneficiary) return false;
    const cleanActual = r.lienBeneficiary.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanExpected = (expectedBeneficiary || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleanExpected && !cleanActual.includes('aicte') && !cleanActual.includes(cleanExpected);
  });

  if (beneficiaryMismatch) {
    return {
      status: SIMULATED_LIEN_STATUS.SIMULATED_BENEFICIARY_MISMATCH,
      isSimulated: true,
      disclaimer: SIMULATED_LIEN_DISCLAIMER,
      originalLienStatus: originalReq?.lienMarked ? 'LIEN_CONFIRMED' : 'UNCONFIRMED',
      replacementLienStatus: 'BENEFICIARY_MISMATCH',
      details: `Simulated lien beneficiary on replacement deposit does not match required authority (${expectedBeneficiary}).`,
      evidenceCount: replacementReqs.length,
    };
  }

  // Everything matches in simulation
  return {
    status: SIMULATED_LIEN_STATUS.SIMULATED_LIEN_CONTINUITY_MATCH,
    isSimulated: true,
    disclaimer: SIMULATED_LIEN_DISCLAIMER,
    originalLienStatus: originalReq?.lienMarked ? 'LIEN_CONFIRMED' : 'UNCONFIRMED',
    replacementLienStatus: 'LIEN_CONFIRMED_MATCH',
    details: 'Simulated bank confirmation verifies continuous joint lien marked in favor of the competent authority.',
    evidenceCount: replacementReqs.length,
    verificationReferences: replacementReqs.map((r) => r.requestReference || r.requestId),
  };
}
