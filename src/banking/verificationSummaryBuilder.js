/**
 * NidhiSetu Banking Simulator — Verification Summary Builder
 * Aggregates comparison results, lien evaluations, and response telemetry into a structured verification dossier summary.
 */

import { bankFieldComparator, COMPARISON_OUTCOME } from './bankFieldComparator';
import { lienStatusEngine, LIEN_EVALUATION_OUTCOME } from './lienStatusEngine';
import { SIMULATION_DISCLAIMER } from './bankMessageSchema';

export const verificationSummaryBuilder = {
  /**
   * Builds a complete verification summary scorecard for officer review
   *
   * @param {Object} verificationRequest
   * @param {Object} fdrRecord
   * @param {Object} bankResponse
   * @returns {Object} Full dossier summary
   */
  buildSummary(verificationRequest, fdrRecord, bankResponse) {
    const comparison = bankFieldComparator.compareFdrWithBankResponse(
      fdrRecord,
      bankResponse
    );

    const lienEvaluation = lienStatusEngine.evaluateLienStatus(
      fdrRecord,
      bankResponse
    );

    const isMatch =
      comparison.overallOutcome === COMPARISON_OUTCOME.MATCH &&
      lienEvaluation.outcome === LIEN_EVALUATION_OUTCOME.MATCHED_IN_SIMULATION;

    const hasCriticalDiscrepancy =
      comparison.overallOutcome === COMPARISON_OUTCOME.MISMATCH ||
      lienEvaluation.outcome === LIEN_EVALUATION_OUTCOME.NOT_RECORDED_IN_SIMULATION ||
      lienEvaluation.outcome === LIEN_EVALUATION_OUTCOME.BENEFICIARY_MISMATCH_IN_SIMULATION;

    let verificationVerdict = 'INDETERMINATE';
    if (isMatch) {
      verificationVerdict = 'CONSISTENT_WITH_SIMULATION';
    } else if (hasCriticalDiscrepancy) {
      verificationVerdict = 'DISCREPANCIES_DETECTED';
    }

    return {
      requestId: verificationRequest?.requestId,
      fdrId: fdrRecord?.id,
      fdrNumber: fdrRecord?.fdrNumber,
      institutionId: fdrRecord?.institutionId,
      disclaimer: SIMULATION_DISCLAIMER,
      evaluatedAt: new Date().toISOString(),
      scenarioId: bankResponse?.scenarioId || verificationRequest?.scenarioId,
      comparison,
      lienEvaluation,
      verificationVerdict,
      isConsistent: isMatch,
      hasDiscrepancies: hasCriticalDiscrepancy,
      findings: comparison.findings,
      fieldSummary: comparison.fieldComparisons,
      summaryText: comparison.summaryText,
    };
  },
};
