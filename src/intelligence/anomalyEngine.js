/**
 * NidhiSetu Document Intelligence — Explainable Anomaly Engine
 * Generates structured, deterministic, auditable findings based on cross-field validation,
 * date sequence logic, duplicate fingerprint collisions, and extraction completeness.
 *
 * NOTE: Findings indicate observable documentary discrepancies, NOT legal proof of fraud.
 */

import { FINDING_SEVERITY, FINDING_TYPE, COMPARISON_RESULT } from './analysisModel';
import { DUPLICATE_CLASSIFICATION } from './duplicateDetector';

/**
 * Evaluates comparison results, duplicate collisions, and timeline consistency
 * to produce explainable anomaly findings.
 *
 * @param {Object} comparisonOutput - Results from compareFields
 * @param {Object} duplicateReport - Output from detectDuplicateFingerprint
 * @param {Object} extractionMetadata - OCR processing stats (pageCount, wordCount, unreadable)
 * @param {Object} submittedFdr - The FDR record
 * @returns {Array<Object>} List of explainable findings
 */
export function generateFindings(comparisonOutput = {}, duplicateReport = {}, extractionMetadata = {}, submittedFdr = {}) {
  const findings = [];
  const comparisons = comparisonOutput.comparisons || {};
  const fdrId = submittedFdr.id || 'fdr-unknown';
  const now = new Date().toISOString();

  // Helper to create stable, reproducible finding ID
  const makeFindingId = (type, suffix = 'main') => `fnd-${fdrId}-${type}-${suffix}`.toLowerCase();

  // 1. Unreadable or very low text document finding
  if (extractionMetadata.isUnreadable || (extractionMetadata.wordCount !== undefined && extractionMetadata.wordCount < 10)) {
    findings.push({
      findingId: makeFindingId(FINDING_TYPE.UNREADABLE_OR_PARTIAL_TEXT, 'scan'),
      findingType: FINDING_TYPE.UNREADABLE_OR_PARTIAL_TEXT,
      severity: FINDING_SEVERITY.HIGH,
      field: 'document',
      explanation:
        'Uploaded scan contains insufficient decipherable text. Document may be low resolution, skewed, or unreadable by optical recognition.',
      submittedValue: submittedFdr.fileName || 'Attached file',
      extractedValue: `${extractionMetadata.wordCount || 0} recognized words`,
      evidenceSnippet: extractionMetadata.rawSampleSnippet || 'No decipherable text detected.',
      sourcePage: 1,
      confidenceLabel: 'HIGH_CERTAINTY',
      recommendedAction:
        'Request a high-resolution color scan or original PDF certificate from the issuing institution.',
      createdAt: now,
    });
  }

  // 2. Exact Duplicate SHA-256 Collisions
  if (duplicateReport.isDuplicate) {
    let dupSeverity = FINDING_SEVERITY.MEDIUM;
    if (duplicateReport.classification === DUPLICATE_CLASSIFICATION.CROSS_INSTITUTION_COLLISION) {
      dupSeverity = FINDING_SEVERITY.HIGH;
    } else if (duplicateReport.classification === DUPLICATE_CLASSIFICATION.CONTEXTUAL_RENEWAL) {
      dupSeverity = FINDING_SEVERITY.INFO;
    }

    findings.push({
      findingId: makeFindingId(FINDING_TYPE.DUPLICATE_DOCUMENT_FINGERPRINT, duplicateReport.classification),
      findingType: FINDING_TYPE.DUPLICATE_DOCUMENT_FINGERPRINT,
      severity: dupSeverity,
      field: 'sha256Hash',
      explanation: duplicateReport.explanation,
      submittedValue: submittedFdr.sha256Hash ? `${submittedFdr.sha256Hash.slice(0, 16)}...` : 'N/A',
      extractedValue: `Collision with ${duplicateReport.collisionCount || duplicateReport.matches?.length || 1} existing record(s)`,
      evidenceSnippet: `Fingerprint collision category: ${duplicateReport.classification}`,
      sourcePage: 1,
      confidenceLabel: 'EXACT_HASH_MATCH',
      recommendedAction: duplicateReport.recommendedAction,
      matches: duplicateReport.matches,
      createdAt: now,
    });
  }

  // 3. Deposit Amount Mismatch
  const amtComp = comparisons.depositAmount;
  if (amtComp && amtComp.result === COMPARISON_RESULT.MISMATCH) {
    findings.push({
      findingId: makeFindingId(FINDING_TYPE.AMOUNT_MISMATCH, 'val'),
      findingType: FINDING_TYPE.AMOUNT_MISMATCH,
      severity: FINDING_SEVERITY.HIGH,
      field: 'depositAmount',
      explanation: amtComp.explanation,
      submittedValue: amtComp.submittedRaw,
      extractedValue: amtComp.extractedRaw,
      evidenceSnippet: amtComp.sourceSnippet || 'Principal deposit amount line',
      sourcePage: amtComp.sourcePage || 1,
      confidenceLabel: amtComp.confidenceIndicator || 'HIGH',
      recommendedAction:
        'Verify submitted financial liability against physical bank receipt. An altered amount alters statutory deposit compliance.',
      createdAt: now,
    });
  }

  // 4. Maturity Date Mismatch
  const matComp = comparisons.maturityDate;
  if (matComp && matComp.result === COMPARISON_RESULT.MISMATCH) {
    findings.push({
      findingId: makeFindingId(FINDING_TYPE.MATURITY_DATE_MISMATCH, 'val'),
      findingType: FINDING_TYPE.MATURITY_DATE_MISMATCH,
      severity: FINDING_SEVERITY.HIGH,
      field: 'maturityDate',
      explanation: matComp.explanation,
      submittedValue: matComp.submittedRaw,
      extractedValue: matComp.extractedRaw,
      evidenceSnippet: matComp.sourceSnippet || 'Maturity date line',
      sourcePage: matComp.sourcePage || 1,
      confidenceLabel: matComp.confidenceIndicator || 'MEDIUM',
      recommendedAction:
        'Examine deposit tenure. If the certificate matures earlier than claimed, security coverage will expire prematurely.',
      createdAt: now,
    });
  }

  // 5. Deposit Date Mismatch
  const depComp = comparisons.depositDate;
  if (depComp && depComp.result === COMPARISON_RESULT.MISMATCH) {
    findings.push({
      findingId: makeFindingId(FINDING_TYPE.DEPOSIT_DATE_MISMATCH, 'val'),
      findingType: FINDING_TYPE.DEPOSIT_DATE_MISMATCH,
      severity: FINDING_SEVERITY.MEDIUM,
      field: 'depositDate',
      explanation: depComp.explanation,
      submittedValue: depComp.submittedRaw,
      extractedValue: depComp.extractedRaw,
      evidenceSnippet: depComp.sourceSnippet || 'Issue date line',
      sourcePage: depComp.sourcePage || 1,
      confidenceLabel: depComp.confidenceIndicator || 'MEDIUM',
      recommendedAction:
        'Verify certificate issuance date with issuing bank branch records.',
      createdAt: now,
    });
  }

  // 6. Inconsistent Date Sequence (Deposit Date >= Maturity Date)
  const effDepDate = amtComp?.submittedNormalized ? submittedFdr.depositDate : (depComp?.extractedNormalized || submittedFdr.depositDate);
  const effMatDate = matComp?.submittedNormalized ? submittedFdr.maturityDate : (matComp?.extractedNormalized || submittedFdr.maturityDate);
  if (effDepDate && effMatDate && effDepDate >= effMatDate) {
    findings.push({
      findingId: makeFindingId(FINDING_TYPE.INCONSISTENT_DATE_SEQUENCE, 'chronology'),
      findingType: FINDING_TYPE.INCONSISTENT_DATE_SEQUENCE,
      severity: FINDING_SEVERITY.HIGH,
      field: 'dates',
      explanation: `Deposit creation date (${effDepDate}) is equal to or after the stated maturity date (${effMatDate}). A fixed deposit tenure must have a future maturity.`,
      submittedValue: `Deposit: ${effDepDate}, Maturity: ${effMatDate}`,
      extractedValue: 'Inverted timeline sequence',
      evidenceSnippet: 'Chronological timeline check failed',
      sourcePage: 1,
      confidenceLabel: 'DETERMINISTIC_RULE',
      recommendedAction:
        'Immediate officer clarification required. Inverted tenure dates suggest typographical mistake or invalid instrument.',
      createdAt: now,
    });
  }

  // 7. IFSC Code Mismatch
  const ifscComp = comparisons.ifsc;
  if (ifscComp && ifscComp.result === COMPARISON_RESULT.MISMATCH) {
    findings.push({
      findingId: makeFindingId(FINDING_TYPE.IFSC_MISMATCH, 'val'),
      findingType: FINDING_TYPE.IFSC_MISMATCH,
      severity: FINDING_SEVERITY.MEDIUM,
      field: 'ifsc',
      explanation: ifscComp.explanation,
      submittedValue: ifscComp.submittedRaw,
      extractedValue: ifscComp.extractedRaw,
      evidenceSnippet: ifscComp.sourceSnippet || 'Branch IFSC line',
      sourcePage: ifscComp.sourcePage || 1,
      confidenceLabel: ifscComp.confidenceIndicator || 'HIGH',
      recommendedAction:
        'Check whether the bank branch was merged, re-coded, or incorrectly entered during portal submission.',
      createdAt: now,
    });
  }

  // 8. FDR Number Mismatch
  const fdrNumComp = comparisons.fdrNumber;
  if (fdrNumComp && fdrNumComp.result === COMPARISON_RESULT.MISMATCH) {
    findings.push({
      findingId: makeFindingId(FINDING_TYPE.FDR_NUMBER_MISMATCH, 'val'),
      findingType: FINDING_TYPE.FDR_NUMBER_MISMATCH,
      severity: FINDING_SEVERITY.HIGH,
      field: 'fdrNumber',
      explanation: fdrNumComp.explanation,
      submittedValue: fdrNumComp.submittedRaw,
      extractedValue: fdrNumComp.extractedRaw,
      evidenceSnippet: fdrNumComp.sourceSnippet || 'Receipt / Certificate No line',
      sourcePage: fdrNumComp.sourcePage || 1,
      confidenceLabel: fdrNumComp.confidenceIndicator || 'HIGH',
      recommendedAction:
        'Confirm whether the attached file belongs to a different deposit certificate than the entered metadata.',
      createdAt: now,
    });
  }

  // 9. Account Holder Name Conflict
  const accComp = comparisons.accountHolderName;
  if (accComp && accComp.result === COMPARISON_RESULT.MISMATCH) {
    findings.push({
      findingId: makeFindingId(FINDING_TYPE.ACCOUNT_HOLDER_MISMATCH, 'val'),
      findingType: FINDING_TYPE.ACCOUNT_HOLDER_MISMATCH,
      severity: FINDING_SEVERITY.MEDIUM,
      field: 'accountHolderName',
      explanation: accComp.explanation,
      submittedValue: accComp.submittedRaw,
      extractedValue: accComp.extractedRaw,
      evidenceSnippet: accComp.sourceSnippet || 'In favour of / Account holder line',
      sourcePage: accComp.sourcePage || 1,
      confidenceLabel: accComp.confidenceIndicator || 'MEDIUM',
      recommendedAction:
        'Ensure the security deposit is pledged jointly to Member Secretary / AICTE or designated authority.',
      createdAt: now,
    });
  }

  // 10. Missing Critical Fields in Document
  const criticalFields = ['bankName', 'ifsc', 'fdrNumber', 'depositAmount', 'maturityDate'];
  for (const cKey of criticalFields) {
    const comp = comparisons[cKey];
    if (comp && comp.result === COMPARISON_RESULT.MISSING_IN_DOCUMENT && !extractionMetadata.isUnreadable) {
      findings.push({
        findingId: makeFindingId(FINDING_TYPE.MISSING_CRITICAL_FIELD, cKey),
        findingType: FINDING_TYPE.MISSING_CRITICAL_FIELD,
        severity: FINDING_SEVERITY.LOW,
        field: cKey,
        explanation: `Field '${comp.label}' was submitted in the portal but was not reliably parsed from the document.`,
        submittedValue: comp.submittedRaw,
        extractedValue: 'Not detected',
        evidenceSnippet: 'Field not located within recognized text regions',
        sourcePage: 1,
        confidenceLabel: 'EXTRACTION_GAP',
        recommendedAction:
          'Inspect document preview visually to ensure the field is present on the paper certificate.',
        createdAt: now,
      });
    }
  }

  // 11. Ambiguous Multiple Candidates
  for (const [key, comp] of Object.entries(comparisons)) {
    if (comp && comp.result === COMPARISON_RESULT.AMBIGUOUS) {
      findings.push({
        findingId: makeFindingId('ambiguous_candidate', key),
        findingType: 'AMBIGUOUS_CANDIDATE',
        severity: FINDING_SEVERITY.LOW,
        field: key,
        explanation: comp.explanation,
        submittedValue: comp.submittedRaw,
        extractedValue: (comp.candidates || []).map((c) => c.value).join(', '),
        evidenceSnippet: comp.sourceSnippet || 'Multiple conflicting text regions',
        sourcePage: comp.sourcePage || 1,
        confidenceLabel: 'AMBIGUOUS',
        recommendedAction:
          'Manual officer verification needed to confirm which candidate value represents the true field.',
        createdAt: now,
      });
    }
  }

  return findings;
}
