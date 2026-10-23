/**
 * NidhiSetu Document Intelligence — Analysis Report & Scorecard Builder
 * Assembles transparent, explainable 4-dimensional scorecards without misleading
 * "authenticity percentages" or unverified regulatory seals.
 */

import {
  ANALYSIS_VERSION,
  EXTRACTION_VERSION,
  ANALYSIS_STATUS,
  SCORECARD_LABEL,
  FINDING_SEVERITY,
  ANALYZABLE_FIELDS,
} from './analysisModel';

/**
 * Builds the comprehensive Document Intelligence report.
 *
 * @param {Object} params - Input data for the report
 * @returns {Object} Complete versioned analysis record
 */
export function buildAnalysisReport({
  fdrRecord = {},
  extractedFields = {},
  comparisonOutput = {},
  duplicateReport = {},
  findings = [],
  extractionMetadata = {},
  processingDurationMs = 0,
}) {
  const fdrId = fdrRecord.id || 'unknown';
  const now = new Date().toISOString();
  const analysisId = `ana-${fdrId.replace(/[^a-zA-Z0-9_-]/g, '')}-${Date.now().toString(36)}`;

  // 1. Completeness Dimension: Exactly fields extracted out of analyzable fields
  const totalAnalyzable = ANALYZABLE_FIELDS.length;
  const extractedCount = ANALYZABLE_FIELDS.filter((f) => extractedFields[f.key]?.extractedValue).length;
  const completenessPercent = Math.round((extractedCount / totalAnalyzable) * 100);

  // 2. Readability Dimension
  const wordCount = extractionMetadata.wordCount || 0;
  let readabilityStatus = 'CLEAR_TEXT';
  let readabilityScore = 100;
  if (extractionMetadata.isUnreadable || wordCount < 10) {
    readabilityStatus = 'UNREADABLE';
    readabilityScore = 20;
  } else if (wordCount < 40) {
    readabilityStatus = 'LOW_RESOLUTION_PARTIAL';
    readabilityScore = 60;
  }

  // 3. Consistency Dimension
  const comparisonSummary = comparisonOutput.summary || {
    matchCount: 0,
    mismatchCount: 0,
    ambiguousCount: 0,
  };

  // 4. Duplicate Signals Dimension
  const hasDuplicate = duplicateReport.isDuplicate || false;
  const duplicateClassification = duplicateReport.classification || 'NONE';

  // 5. Determine Overall Explainable Scorecard Label
  const hasHighSeverityFinding = findings.some((f) => f.severity === FINDING_SEVERITY.HIGH);
  const hasMediumSeverityFinding = findings.some((f) => f.severity === FINDING_SEVERITY.MEDIUM);

  let overallLabel = SCORECARD_LABEL.NO_DISCREPANCY;
  if (hasHighSeverityFinding) {
    overallLabel = SCORECARD_LABEL.HIGH_PRIORITY_DISCREPANCY;
  } else if (readabilityStatus === 'UNREADABLE' || completenessPercent < 50) {
    overallLabel = SCORECARD_LABEL.INCOMPLETE_EXTRACTION;
  } else if (hasMediumSeverityFinding || comparisonSummary.mismatchCount > 0 || hasDuplicate) {
    overallLabel = SCORECARD_LABEL.REVIEW_RECOMMENDED;
  }

  // Deterministic analysis fingerprint for audit tracking
  const findingKeys = findings.map((f) => f.findingId).sort().join('|');
  const rawFingerprint = `${fdrRecord.sha256Hash || 'nohash'}:${findingKeys}:${completenessPercent}`;

  return {
    analysisId,
    fdrId: fdrRecord.id,
    institutionId: fdrRecord.institutionId,
    institutionName: fdrRecord.institutionName,
    referenceNumber: fdrRecord.referenceNumber,
    documentId: fdrRecord.documentId || null,
    documentSha256: fdrRecord.sha256Hash || null,
    documentFileName: fdrRecord.fileName || extractionMetadata.fileName || 'document.pdf',
    analysisVersion: ANALYSIS_VERSION,
    extractionVersion: EXTRACTION_VERSION,
    analyzedAt: now,
    processingStatus: ANALYSIS_STATUS.COMPLETED,
    sourceType: extractionMetadata.sourceType || 'PDF_TEXT',
    processingDurationMs,
    extractedFields,
    comparisonResults: comparisonOutput.comparisons || {},
    findings,
    scorecard: {
      overallScorecardLabel: overallLabel,
      // Dimension 1: Extraction Completeness
      completeness: {
        extractedCount,
        totalFields: totalAnalyzable,
        percentage: completenessPercent,
        formula: `${extractedCount} / ${totalAnalyzable} fields extracted (${completenessPercent}%)`,
      },
      // Dimension 2: Field Consistency
      consistency: {
        matchedCount: comparisonSummary.matchCount,
        mismatchedCount: comparisonSummary.mismatchCount,
        ambiguousCount: comparisonSummary.ambiguousCount,
        criticalMismatches: comparisonSummary.criticalMismatches || 0,
        label:
          comparisonSummary.mismatchCount === 0 && comparisonSummary.ambiguousCount === 0
            ? 'Fully Consistent'
            : `${comparisonSummary.mismatchCount} Discrepancy(ies)`,
      },
      // Dimension 3: Duplicate Signals
      duplicateSignals: {
        isDuplicate: hasDuplicate,
        classification: duplicateClassification,
        collisionCount: duplicateReport.collisionCount || duplicateReport.matches?.length || 0,
        label: hasDuplicate ? `Duplicate Detected (${duplicateClassification})` : 'Unique Document',
      },
      // Dimension 4: Document Readability
      readability: {
        status: readabilityStatus,
        wordCount,
        pageCount: extractionMetadata.pageCount || 1,
        score: readabilityScore,
        label: readabilityStatus === 'CLEAR_TEXT' ? 'Clear & Decipherable' : 'Sub-optimal OCR Readability',
      },
    },
    analysisFingerprint: rawFingerprint,
  };
}
