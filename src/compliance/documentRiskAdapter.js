/**
 * NidhiSetu Document Intelligence Risk Adapter
 * Consumes Module 04 document OCR findings and officer intelligence reviews
 * WITHOUT modifying any Module 04 data structures or states.
 *
 * Distinguishes OCR statistical uncertainty from confirmed officer-reviewed discrepancies.
 * Excludes stale analyses (e.g., when a document was superseded or re-uploaded).
 */

import { documentAnalysisRepository } from '../storage/documentAnalysisRepository';
import { intelligenceReviewRepository } from '../storage/intelligenceReviewRepository';

export const DOCUMENT_RISK_TYPES = {
  AMOUNT_MISMATCH: 'DOC_AMOUNT_MISMATCH',
  MATURITY_MISMATCH: 'DOC_MATURITY_MISMATCH',
  FDR_NUMBER_MISMATCH: 'DOC_FDR_NUMBER_MISMATCH',
  IFSC_MISMATCH: 'DOC_IFSC_MISMATCH',
  MISSING_CRITICAL_FIELDS: 'DOC_MISSING_CRITICAL_FIELDS',
  DUPLICATE_FINGERPRINT: 'DOC_DUPLICATE_FINGERPRINT',
  UNREADABLE_DOCUMENT: 'DOC_UNREADABLE_DOCUMENT',
  UNRESOLVED_OFFICER_FINDING: 'DOC_UNRESOLVED_OFFICER_FINDING',
  CONFIRMED_DISCREPANCY: 'DOC_CONFIRMED_DISCREPANCY',
};

/**
 * Extracts and adapts Module 04 document findings for an FDR.
 *
 * @param {Object} fdr - Current FDR record
 * @returns {Promise<Object>} Adapted document intelligence evidence
 */
export async function extractDocumentRisksForFdr(fdr) {
  if (!fdr || !fdr.id) {
    return {
      fdrId: null,
      status: 'NO_DOCUMENT',
      findings: [],
      hasStaleAnalysis: false,
    };
  }

  const fdrId = String(fdr.id || fdr.fdrId);
  const latestAnalysis = await documentAnalysisRepository.getLatestAnalysisByFdrId(fdrId);

  if (!latestAnalysis) {
    return {
      fdrId,
      status: 'ANALYSIS_NOT_PERFORMED',
      findings: [],
      hasStaleAnalysis: false,
    };
  }

  // Check if analysis is stale
  const isStale = documentAnalysisRepository.isAnalysisStale(latestAnalysis, fdr);
  if (isStale) {
    return {
      fdrId,
      analysisId: latestAnalysis.analysisId,
      status: 'ANALYSIS_STALE',
      findings: [],
      hasStaleAnalysis: true,
      staleReason: latestAnalysis.staleReason || 'FDR metadata or document hash has changed since analysis.',
    };
  }

  // Retrieve officer intelligence reviews for findings of this FDR
  const officerReviews = await intelligenceReviewRepository.getReviewsByFdrId(fdrId);
  const reviewMap = new Map();
  officerReviews.forEach((rev) => {
    reviewMap.set(rev.findingId, rev);
  });

  const adaptedFindings = [];
  const rawFindings = latestAnalysis.findings || [];

  rawFindings.forEach((raw) => {
    const review = reviewMap.get(raw.findingId);
    const reviewStatus = review ? review.reviewStatus : 'UNREVIEWED';

    // If dismissed by officer, skip from active compliance risk
    if (reviewStatus === 'DISMISSED') {
      return;
    }

    const isConfirmedDiscrepancy = reviewStatus === 'CONFIRMED_DISCREPANCY';
    const severity = isConfirmedDiscrepancy ? 'HIGH' : raw.severity === 'HIGH' ? 'MEDIUM' : 'LOW';

    let riskType = DOCUMENT_RISK_TYPES.UNRESOLVED_OFFICER_FINDING;
    const cat = (raw.findingCategory || raw.category || raw.type || '').toUpperCase();

    if (isConfirmedDiscrepancy) {
      riskType = DOCUMENT_RISK_TYPES.CONFIRMED_DISCREPANCY;
    } else if (cat.includes('AMOUNT')) {
      riskType = DOCUMENT_RISK_TYPES.AMOUNT_MISMATCH;
    } else if (cat.includes('MATURITY') || cat.includes('DATE')) {
      riskType = DOCUMENT_RISK_TYPES.MATURITY_MISMATCH;
    } else if (cat.includes('FDR') || cat.includes('NUMBER')) {
      riskType = DOCUMENT_RISK_TYPES.FDR_NUMBER_MISMATCH;
    } else if (cat.includes('IFSC') || cat.includes('BRANCH')) {
      riskType = DOCUMENT_RISK_TYPES.IFSC_MISMATCH;
    } else if (cat.includes('DUPLICATE')) {
      riskType = DOCUMENT_RISK_TYPES.DUPLICATE_FINGERPRINT;
    } else if (cat.includes('READ') || cat.includes('QUALITY')) {
      riskType = DOCUMENT_RISK_TYPES.UNREADABLE_DOCUMENT;
    } else if (cat.includes('FIELD') || cat.includes('MISSING')) {
      riskType = DOCUMENT_RISK_TYPES.MISSING_CRITICAL_FIELDS;
    }

    adaptedFindings.push({
      signalId: `DOC-${raw.findingId}`,
      originalFindingId: raw.findingId,
      fdrId,
      fdrNumber: fdr.fdrNumber,
      analysisId: latestAnalysis.analysisId,
      riskType,
      severity,
      reviewStatus,
      isConfirmedDiscrepancy,
      field: raw.field || raw.fieldName,
      declaredValue: raw.declaredValue,
      extractedValue: raw.extractedValue,
      confidenceScore: raw.confidenceScore,
      explanation: raw.explanation || raw.message,
      officerNote: review ? review.justificationReason || review.notes : null,
      dossierLink: `/officer/intelligence/${fdrId}`,
      source: 'MODULE_04_DOCUMENT_INTELLIGENCE',
    });
  });

  return {
    fdrId,
    analysisId: latestAnalysis.analysisId,
    analyzedAt: latestAnalysis.analyzedAt,
    documentHash: latestAnalysis.documentSha256 || fdr.sha256Hash,
    status: 'ACTIVE_EVIDENCE',
    findings: adaptedFindings,
    hasStaleAnalysis: false,
    dossierLink: `/officer/intelligence/${fdrId}`,
  };
}

/**
 * Extracts document risks for a collection of eligible FDRs.
 */
export async function extractAllDocumentRisks(fdrRecords = []) {
  const results = await Promise.all(fdrRecords.map((fdr) => extractDocumentRisksForFdr(fdr)));
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
