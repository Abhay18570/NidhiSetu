/**
 * NidhiSetu Document Intelligence — Cross-Field Validation Engine
 * Compares machine-extracted OCR document fields against institution-submitted FDR metadata.
 * Uses normalized integer paise for financial comparisons, ISO dates for timeline checks,
 * and canonical aliases for financial institution names.
 */

import { COMPARISON_RESULT, ANALYZABLE_FIELDS } from './analysisModel';
import {
  normalizeDate,
  normalizeDepositAmount,
  normalizeIFSC,
  normalizeFdrNumber,
  normalizeBankName,
  normalizeInterestRate,
  normalizeGeneralText,
} from './fieldNormalizer';

/**
 * Compares extracted document fields with submitted FDR metadata.
 *
 * @param {Object} extractedFields - Output from fdrFieldExtractor (keyed by field name)
 * @param {Object} submittedFdr - The FDR record submitted by the institution
 * @returns {Object} Comparison report containing per-field results and summary counts
 */
export function compareFields(extractedFields = {}, submittedFdr = {}) {
  const comparisons = {};
  let matchCount = 0;
  let mismatchCount = 0;
  let missingInDocCount = 0;
  let ambiguousCount = 0;

  for (const fieldDef of ANALYZABLE_FIELDS) {
    const key = fieldDef.key;
    const extractedData = extractedFields[key] || null;
    const rawExtractedValue = extractedData?.extractedValue ?? null;
    const candidates = extractedData?.candidates || [];

    let submittedRaw = null;
    let submittedNormalized = null;
    let extractedNormalized = extractedData?.normalizedValue ?? null;
    let result = COMPARISON_RESULT.NOT_ANALYZED;
    let explanation = '';

    switch (key) {
      case 'bankName': {
        submittedRaw = submittedFdr.bankName || null;
        submittedNormalized = submittedRaw ? normalizeBankName(submittedRaw) : null;
        extractedNormalized = rawExtractedValue ? normalizeBankName(rawExtractedValue) : null;

        if (submittedRaw && rawExtractedValue) {
          if (submittedNormalized === extractedNormalized) {
            result = COMPARISON_RESULT.MATCH;
            explanation = 'Bank name matches official institution alias.';
          } else if (
            submittedNormalized &&
            extractedNormalized &&
            (submittedNormalized.includes(extractedNormalized) || extractedNormalized.includes(submittedNormalized))
          ) {
            result = COMPARISON_RESULT.MATCH;
            explanation = 'Bank name matches canonical abbreviation or substring.';
          } else {
            result = COMPARISON_RESULT.MISMATCH;
            explanation = `Submitted bank (${submittedRaw}) differs from extracted bank (${rawExtractedValue}).`;
          }
        } else if (submittedRaw && !rawExtractedValue) {
          result = COMPARISON_RESULT.MISSING_IN_DOCUMENT;
          explanation = 'Bank name could not be reliably located in the uploaded document.';
        } else if (!submittedRaw && rawExtractedValue) {
          result = COMPARISON_RESULT.MISSING_IN_SUBMISSION;
          explanation = 'Bank name detected in document but missing in submission metadata.';
        }
        break;
      }

      case 'ifsc': {
        submittedRaw = submittedFdr.ifsc || null;
        submittedNormalized = submittedRaw ? normalizeIFSC(submittedRaw) : null;
        extractedNormalized = rawExtractedValue ? normalizeIFSC(rawExtractedValue) : null;

        if (submittedRaw && rawExtractedValue) {
          if (submittedNormalized && extractedNormalized && submittedNormalized === extractedNormalized) {
            result = COMPARISON_RESULT.MATCH;
            explanation = 'IFSC code matches exactly.';
          } else {
            result = COMPARISON_RESULT.MISMATCH;
            explanation = `Submitted IFSC (${submittedRaw}) differs from extracted (${rawExtractedValue}).`;
          }
        } else if (submittedRaw && !rawExtractedValue) {
          result = COMPARISON_RESULT.MISSING_IN_DOCUMENT;
          explanation = 'Branch IFSC code was not identified in the document text.';
        } else if (!submittedRaw && rawExtractedValue) {
          result = COMPARISON_RESULT.MISSING_IN_SUBMISSION;
          explanation = 'IFSC code extracted from document but missing in submission.';
        }
        break;
      }

      case 'fdrNumber': {
        submittedRaw = submittedFdr.fdrNumber || null;
        submittedNormalized = submittedRaw ? normalizeFdrNumber(submittedRaw) : null;
        extractedNormalized = rawExtractedValue ? normalizeFdrNumber(rawExtractedValue) : null;

        if (submittedRaw && rawExtractedValue) {
          if (submittedNormalized && extractedNormalized && submittedNormalized === extractedNormalized) {
            result = COMPARISON_RESULT.MATCH;
            explanation = 'FDR certificate number matches perfectly.';
          } else if (
            submittedNormalized &&
            extractedNormalized &&
            (submittedNormalized.includes(extractedNormalized) || extractedNormalized.includes(submittedNormalized))
          ) {
            // Could be prefix noise
            result = COMPARISON_RESULT.MATCH;
            explanation = 'FDR number matches with minor prefix/suffix variance.';
          } else {
            result = COMPARISON_RESULT.MISMATCH;
            explanation = `Submitted FDR number (${submittedRaw}) differs from extracted (${rawExtractedValue}).`;
          }
        } else if (submittedRaw && !rawExtractedValue) {
          result = COMPARISON_RESULT.MISSING_IN_DOCUMENT;
          explanation = 'FDR receipt number was not recognized in the document text.';
        } else if (!submittedRaw && rawExtractedValue) {
          result = COMPARISON_RESULT.MISSING_IN_SUBMISSION;
          explanation = 'FDR number found in document but missing in record.';
        }
        break;
      }

      case 'depositAmount': {
        // Authoritative comparison in integer paise
        if (submittedFdr.depositAmountPaise !== undefined && submittedFdr.depositAmountPaise !== null) {
          submittedNormalized = Number(submittedFdr.depositAmountPaise);
          submittedRaw = `₹ ${(submittedNormalized / 100).toLocaleString('en-IN')}`;
        } else if (submittedFdr.depositAmount) {
          submittedNormalized = normalizeDepositAmount(submittedFdr.depositAmount);
          submittedRaw = String(submittedFdr.depositAmount);
        }

        if (extractedNormalized === null && rawExtractedValue) {
          extractedNormalized = normalizeDepositAmount(rawExtractedValue);
        }

        if (submittedNormalized !== null && extractedNormalized !== null) {
          // Strict integer paise comparison
          if (submittedNormalized === extractedNormalized) {
            result = COMPARISON_RESULT.MATCH;
            explanation = 'Deposit principal amount matches exactly in paise.';
          } else {
            result = COMPARISON_RESULT.MISMATCH;
            const diffPaise = Math.abs(submittedNormalized - extractedNormalized);
            explanation = `Amount mismatch: Submitted ₹ ${(submittedNormalized / 100).toLocaleString('en-IN')} vs Extracted ₹ ${(extractedNormalized / 100).toLocaleString('en-IN')} (Difference: ₹ ${(diffPaise / 100).toLocaleString('en-IN')}).`;
          }
        } else if (submittedNormalized !== null && extractedNormalized === null) {
          result = COMPARISON_RESULT.MISSING_IN_DOCUMENT;
          explanation = 'Principal deposit amount could not be parsed from document text.';
        } else if (submittedNormalized === null && extractedNormalized !== null) {
          result = COMPARISON_RESULT.MISSING_IN_SUBMISSION;
          explanation = 'Deposit amount found in document but missing from submission data.';
        }
        break;
      }

      case 'depositDate': {
        submittedRaw = submittedFdr.depositDate || null;
        submittedNormalized = submittedRaw ? normalizeDate(submittedRaw) : null;
        extractedNormalized = rawExtractedValue ? normalizeDate(rawExtractedValue) : null;

        if (submittedNormalized && extractedNormalized) {
          if (submittedNormalized === extractedNormalized) {
            result = COMPARISON_RESULT.MATCH;
            explanation = 'Deposit issue date matches.';
          } else {
            result = COMPARISON_RESULT.MISMATCH;
            explanation = `Submitted deposit date (${submittedNormalized}) does not match document date (${extractedNormalized}).`;
          }
        } else if (submittedNormalized && !extractedNormalized) {
          result = COMPARISON_RESULT.MISSING_IN_DOCUMENT;
          explanation = 'Deposit date not identifiable in document text.';
        } else if (!submittedNormalized && extractedNormalized) {
          result = COMPARISON_RESULT.MISSING_IN_SUBMISSION;
          explanation = 'Deposit date extracted from document but unrecorded in submission.';
        }
        break;
      }

      case 'maturityDate': {
        submittedRaw = submittedFdr.maturityDate || null;
        submittedNormalized = submittedRaw ? normalizeDate(submittedRaw) : null;
        extractedNormalized = rawExtractedValue ? normalizeDate(rawExtractedValue) : null;

        if (submittedNormalized && extractedNormalized) {
          if (submittedNormalized === extractedNormalized) {
            result = COMPARISON_RESULT.MATCH;
            explanation = 'Maturity date matches exactly.';
          } else {
            result = COMPARISON_RESULT.MISMATCH;
            explanation = `Maturity date discrepancy: Submitted ${submittedNormalized} vs Document ${extractedNormalized}.`;
          }
        } else if (submittedNormalized && !extractedNormalized) {
          result = COMPARISON_RESULT.MISSING_IN_DOCUMENT;
          explanation = 'Maturity date was not found in the uploaded scan.';
        } else if (!submittedNormalized && extractedNormalized) {
          result = COMPARISON_RESULT.MISSING_IN_SUBMISSION;
          explanation = 'Maturity date detected in document but missing in submission.';
        }
        break;
      }

      case 'interestRate': {
        submittedRaw = submittedFdr.interestRate ?? null;
        submittedNormalized = submittedRaw !== null ? normalizeInterestRate(submittedRaw) : null;
        extractedNormalized = rawExtractedValue !== null ? normalizeInterestRate(rawExtractedValue) : null;

        if (submittedNormalized !== null && extractedNormalized !== null) {
          if (Math.abs(submittedNormalized - extractedNormalized) <= 0.05) {
            result = COMPARISON_RESULT.MATCH;
            explanation = 'Interest rate matches within allowable tolerance.';
          } else {
            result = COMPARISON_RESULT.MISMATCH;
            explanation = `Submitted interest rate (${submittedNormalized}%) differs from document (${extractedNormalized}%).`;
          }
        } else if (submittedNormalized !== null && extractedNormalized === null) {
          result = COMPARISON_RESULT.MISSING_IN_DOCUMENT;
          explanation = 'Interest rate not explicitly mentioned in document.';
        } else if (submittedNormalized === null && extractedNormalized !== null) {
          result = COMPARISON_RESULT.MISSING_IN_SUBMISSION;
          explanation = 'Interest rate detected in document.';
        }
        break;
      }

      case 'accountHolderName': {
        submittedRaw = submittedFdr.accountHolderName || submittedFdr.jointHolderName || null;
        submittedNormalized = submittedRaw ? normalizeGeneralText(submittedRaw) : null;
        extractedNormalized = rawExtractedValue ? normalizeGeneralText(rawExtractedValue) : null;

        if (submittedNormalized && extractedNormalized) {
          const subTokens = submittedNormalized.split(' ').filter((t) => t.length > 2);
          const extTokens = extractedNormalized.split(' ').filter((t) => t.length > 2);
          const common = subTokens.filter((t) => extTokens.includes(t));

          if (common.length >= Math.min(subTokens.length, 2)) {
            result = COMPARISON_RESULT.MATCH;
            explanation = 'Account holder / joint names share significant keyword overlap.';
          } else {
            result = COMPARISON_RESULT.MISMATCH;
            explanation = `Account holder name on document (${rawExtractedValue}) does not align with submission (${submittedRaw}).`;
          }
        } else if (submittedRaw && !rawExtractedValue) {
          result = COMPARISON_RESULT.MISSING_IN_DOCUMENT;
          explanation = 'Account holder name not clearly identified in document.';
        }
        break;
      }

      default: {
        submittedRaw = submittedFdr[key] || null;
        if (submittedRaw && rawExtractedValue) {
          result =
            String(submittedRaw).trim().toLowerCase() === String(rawExtractedValue).trim().toLowerCase()
              ? COMPARISON_RESULT.MATCH
              : COMPARISON_RESULT.MISMATCH;
        } else if (submittedRaw) {
          result = COMPARISON_RESULT.MISSING_IN_DOCUMENT;
        }
        break;
      }
    }

    // Check if multiple competing candidates were detected with disparate values
    if (candidates.length > 1 && result !== COMPARISON_RESULT.MATCH) {
      const distinctVals = new Set(candidates.map((c) => String(c.value).trim()));
      if (distinctVals.size > 1) {
        result = COMPARISON_RESULT.AMBIGUOUS;
        explanation = `Multiple conflicting text candidates found (${Array.from(distinctVals).slice(0, 3).join(', ')}). Requires manual verification.`;
      }
    }

    if (result === COMPARISON_RESULT.MATCH) matchCount++;
    if (result === COMPARISON_RESULT.MISMATCH) mismatchCount++;
    if (result === COMPARISON_RESULT.MISSING_IN_DOCUMENT) missingInDocCount++;
    if (result === COMPARISON_RESULT.AMBIGUOUS) ambiguousCount++;

    comparisons[key] = {
      field: key,
      label: fieldDef.label,
      critical: fieldDef.critical,
      submittedRaw,
      submittedNormalized,
      extractedRaw: rawExtractedValue,
      extractedNormalized,
      result,
      explanation,
      confidenceIndicator: extractedData?.confidenceIndicator || 'LOW',
      sourceSnippet: extractedData?.sourceSnippet || null,
      sourcePage: extractedData?.sourcePage || 1,
      candidates,
    };
  }

  return {
    comparisons,
    summary: {
      totalAnalyzed: ANALYZABLE_FIELDS.length,
      matchCount,
      mismatchCount,
      missingInDocCount,
      ambiguousCount,
      criticalMismatches: Object.values(comparisons).filter(
        (c) => c.critical && (c.result === COMPARISON_RESULT.MISMATCH || c.result === COMPARISON_RESULT.AMBIGUOUS)
      ).length,
    },
  };
}
