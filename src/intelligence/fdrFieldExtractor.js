/**
 * NidhiSetu Document Intelligence — Financial Field Extraction Engine
 * Deterministic rule-based extraction leveraging label proximity, keyword heuristics,
 * regex patterns, and candidate ranking for Indian Fixed Deposit Receipts.
 */

import {
  normalizeDate,
  normalizeDepositAmount,
  normalizeIFSC,
  normalizeFdrNumber,
  normalizeBankName,
  normalizeInterestRate,
} from './fieldNormalizer';

/**
 * Common Bank Names and Keywords
 */
const KNOWN_BANKS = [
  'State Bank of India',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Central Bank of India',
  'Indian Bank',
  'Bank of Maharashtra',
  'UCO Bank',
  'IDBI Bank',
  'IndusInd Bank',
];

/**
 * Extracts all financial and institutional metadata fields from document text
 * @param {Array<{pageNumber: number, text: string}> | string} pagesOrText
 * @returns {Record<string, object>} Extracted field definitions with confidence and snippets
 */
export function extractFdrFields(pagesOrText) {
  const pages = Array.isArray(pagesOrText)
    ? pagesOrText
    : [{ pageNumber: 1, text: String(pagesOrText || '') }];

  const fullText = pages.map((p) => p.text).join('\n\n');
  const extracted = {};

  // 1. Bank Name Extraction
  extracted.bankName = extractBankName(pages, fullText);

  // 2. IFSC Code Extraction
  extracted.ifsc = extractIFSC(pages, fullText);

  // 3. FDR Certificate Number Extraction
  extracted.fdrNumber = extractFdrNumber(pages, fullText);

  // 4. Deposit Principal Amount Extraction
  extracted.depositAmount = extractDepositAmount(pages, fullText);

  // 5. Deposit Inception Date Extraction
  extracted.depositDate = extractDepositDate(pages, fullText);

  // 6. Maturity Date Extraction
  extracted.maturityDate = extractMaturityDate(pages, fullText);

  // 7. Interest Rate Extraction
  extracted.interestRate = extractInterestRate(pages, fullText);

  // 8. Account Holder Name Extraction
  extracted.accountHolderName = extractAccountHolder(pages, fullText);

  // 9. Branch Name Extraction
  extracted.branchName = extractBranchName(pages, fullText);

  return extracted;
}

/**
 * Extracts issuing bank name
 */
function extractBankName(pages, fullText) {
  for (const page of pages) {
    for (const bank of KNOWN_BANKS) {
      const regex = new RegExp(`\\b${bank.replace(/\s+/g, '\\s+')}\\b`, 'i');
      const match = page.text.match(regex);
      if (match) {
        return {
          fieldName: 'bankName',
          extractedValue: match[0],
          normalizedValue: normalizeBankName(match[0]),
          extractionMethod: 'KEYWORD_MATCH',
          sourcePage: page.pageNumber,
          sourceTextSnippet: getContextSnippet(page.text, match.index, match[0].length),
          confidenceIndicator: 'HIGH',
          alternativeCandidates: [],
        };
      }
    }
  }

  // Fallback: check for "Bank" keyword line
  const bankLineMatch = fullText.match(/([A-Z][a-zA-Z\s]{2,25}Bank(?:\s+of\s+[A-Za-z]+)?)/i);
  if (bankLineMatch) {
    return {
      fieldName: 'bankName',
      extractedValue: bankLineMatch[1].trim(),
      normalizedValue: normalizeBankName(bankLineMatch[1]),
      extractionMethod: 'HEURISTIC_BANK_LINE',
      sourcePage: 1,
      sourceTextSnippet: bankLineMatch[0],
      confidenceIndicator: 'MEDIUM',
      alternativeCandidates: [],
    };
  }

  return null;
}

/**
 * Extracts Indian Financial System Code (IFSC)
 */
function extractIFSC(pages, fullText) {
  // Pattern 1: Explicit label proximity "IFSC : SBIN0001110" or "IFSC Code : SBIN0001110"
  const labelRegex = /(?:IFSC(?:\s+Code)?|RTGS|NEFT)[\s.:/—-]+([A-Z]{4}0[A-Z0-9]{6})\b/i;
  for (const page of pages) {
    const match = page.text.match(labelRegex);
    if (match) {
      return {
        fieldName: 'ifsc',
        extractedValue: match[1].toUpperCase(),
        normalizedValue: normalizeIFSC(match[1]),
        extractionMethod: 'LABEL_PROXIMITY_REGEX',
        sourcePage: page.pageNumber,
        sourceTextSnippet: getContextSnippet(page.text, match.index, match[0].length),
        confidenceIndicator: 'HIGH',
        candidates: [{ value: match[1].toUpperCase(), method: 'LABEL_PROXIMITY' }],
        alternativeCandidates: [],
      };
    }
  }

  // Pattern 2: Standalone 11-char IFSC token
  const ifscRegex = /\b([A-Z]{4}0[A-Z0-9]{6})\b/g;
  const candidates = [];
  let m;
  while ((m = ifscRegex.exec(fullText)) !== null) {
    candidates.push({ val: m[1].toUpperCase(), index: m.index });
  }

  if (candidates.length > 0) {
    const best = candidates[0];
    return {
      fieldName: 'ifsc',
      extractedValue: best.val,
      normalizedValue: normalizeIFSC(best.val),
      extractionMethod: 'STANDALONE_PATTERN',
      sourcePage: 1,
      sourceTextSnippet: getContextSnippet(fullText, best.index, best.val.length),
      confidenceIndicator: 'MEDIUM',
      alternativeCandidates: candidates.slice(1).map((c) => c.val),
    };
  }

  return null;
}

/**
 * Extracts FDR / Term Deposit certificate number
 */
function extractFdrNumber(pages, fullText) {
  // Label patterns: "FDR No.", "Receipt No.", "A/C No.", "Certificate No."
  const patterns = [
    /(?:FDR|Receipt|Certificate|A\/c|Account|Deposit)\s*(?:No|Num|Number|#)[\s.:/—-]+([A-Za-z0-9\-_/]{5,25})\b/i,
    /(?:Term\s*Deposit\s*Receipt\s*No)[\s.:/—-]+([A-Za-z0-9\-_/]{5,25})\b/i,
  ];

  for (const page of pages) {
    for (const pat of patterns) {
      const match = page.text.match(pat);
      if (match) {
        return {
          fieldName: 'fdrNumber',
          extractedValue: match[1].trim(),
          normalizedValue: normalizeFdrNumber(match[1]),
          extractionMethod: 'LABEL_PROXIMITY_REGEX',
          sourcePage: page.pageNumber,
          sourceTextSnippet: getContextSnippet(page.text, match.index, match[0].length),
          confidenceIndicator: 'HIGH',
          alternativeCandidates: [],
        };
      }
    }
  }

  return null;
}

/**
 * Extracts Deposit Principal Amount
 */
function extractDepositAmount(pages, fullText) {
  // Label patterns: "Principal Amount", "Deposit Amount", "Initial Principal", "Revised Principal", etc.
  const patterns = [
    /(?:Principal\s*Amount|Deposit\s*Amount|Initial\s*Principal|Revised\s*Principal|Face\s*Value|Sum\s*of|Principal\s*Sum)[\s.:/—]*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{2})?|\d+\s*(?:Lakhs?|Lacs?|Crores?))/gi,
    /(?:Amount|Value)[\s.:/—]*(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{2})?)/gi,
    /(?:₹|Rs\.?)\s*([\d,]{4,}(?:\.\d{2})?)/gi,
  ];

  const allCandidates = [];
  for (const pat of patterns) {
    let m;
    while ((m = pat.exec(fullText)) !== null) {
      const raw = m[1].trim();
      const paise = normalizeDepositAmount(raw);
      if (paise && paise > 0 && !allCandidates.some((c) => c.normalizedValue === paise)) {
        allCandidates.push({
          value: `₹ ${raw}`,
          raw,
          normalizedValue: paise,
          index: m.index,
        });
      }
    }
  }

  if (allCandidates.length > 0) {
    const best = allCandidates[0];
    return {
      fieldName: 'depositAmount',
      extractedValue: best.value,
      normalizedValue: best.normalizedValue,
      extractionMethod: 'LABEL_PROXIMITY_REGEX',
      sourcePage: 1,
      sourceTextSnippet: getContextSnippet(fullText, best.index, best.value.length),
      confidenceIndicator: allCandidates.length === 1 ? 'HIGH' : 'MEDIUM',
      candidates: allCandidates,
      alternativeCandidates: allCandidates.slice(1).map((c) => c.value),
    };
  }

  return null;
}

/**
 * Extracts deposit inception date
 */
function extractDepositDate(pages, fullText) {
  const patterns = [
    /(?:Date\s*of\s*Deposit|Deposit\s*Date|Issue\s*Date|Effective\s*Date|Inception\s*Date|Opened\s*On)[\s.:/—-]+(\d{1,2}[-/.]\d{1,2}[-/.]\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/i,
    /(?:Date)[\s.:/—]+(\d{1,2}[-/.]\d{1,2}[-/.]\d{4})/i,
  ];

  for (const page of pages) {
    for (const pat of patterns) {
      const match = page.text.match(pat);
      if (match) {
        const normalized = normalizeDate(match[1]);
        if (normalized) {
          return {
            fieldName: 'depositDate',
            extractedValue: match[1].trim(),
            normalizedValue: normalized,
            extractionMethod: 'LABEL_PROXIMITY_REGEX',
            sourcePage: page.pageNumber,
            sourceTextSnippet: getContextSnippet(page.text, match.index, match[0].length),
            confidenceIndicator: 'HIGH',
            alternativeCandidates: [],
          };
        }
      }
    }
  }

  return null;
}

/**
 * Extracts maturity date
 */
function extractMaturityDate(pages, fullText) {
  const patterns = [
    /(?:Maturity\s*Date|Date\s*of\s*Maturity|Due\s*Date|Expires\s*On)[\s.:/—-]+(\d{1,2}[-/.]\d{1,2}[-/.]\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/i,
    /(?:Matures\s*On)[\s.:/—-]+(\d{1,2}[-/.]\d{1,2}[-/.]\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
  ];

  for (const page of pages) {
    for (const pat of patterns) {
      const match = page.text.match(pat);
      if (match) {
        const normalized = normalizeDate(match[1]);
        if (normalized) {
          return {
            fieldName: 'maturityDate',
            extractedValue: match[1].trim(),
            normalizedValue: normalized,
            extractionMethod: 'LABEL_PROXIMITY_REGEX',
            sourcePage: page.pageNumber,
            sourceTextSnippet: getContextSnippet(page.text, match.index, match[0].length),
            confidenceIndicator: 'HIGH',
            alternativeCandidates: [],
          };
        }
      }
    }
  }

  return null;
}

/**
 * Extracts interest rate (% p.a.)
 */
function extractInterestRate(pages, fullText) {
  const patterns = [
    /(?:Interest\s*Rate|Rate\s*of\s*Interest|ROI)[\s.:/—-]+([\d.]+)%?/i,
    /([\d.]+)%\s*(?:p\.?a\.?|per\s*annum)/i,
  ];

  for (const page of pages) {
    for (const pat of patterns) {
      const match = page.text.match(pat);
      if (match) {
        const rate = normalizeInterestRate(match[1]);
        if (rate !== null) {
          return {
            fieldName: 'interestRate',
            extractedValue: `${rate}%`,
            normalizedValue: rate,
            extractionMethod: 'LABEL_PROXIMITY_REGEX',
            sourcePage: page.pageNumber,
            sourceTextSnippet: getContextSnippet(page.text, match.index, match[0].length),
            confidenceIndicator: 'MEDIUM',
            alternativeCandidates: [],
          };
        }
      }
    }
  }

  return null;
}

/**
 * Extracts joint account holder details
 */
function extractAccountHolder(pages, fullText) {
  const patterns = [
    /(?:In\s*the\s*name\s*of|Account\s*Holder|Name\(s\)|Favoring|Beneficiary)[\s.:/—-]+([A-Za-z\s.,&()/-]{5,80})(?:\n|\r|Amount|Rs)/i,
    /(?:Jointly\s*with)[\s.:/—-]+([A-Za-z\s.,&()/-]{5,60})/i,
  ];

  for (const page of pages) {
    for (const pat of patterns) {
      const match = page.text.match(pat);
      if (match && match[1].trim().length > 4) {
        const cleanName = match[1].trim().replace(/\s+/g, ' ');
        return {
          fieldName: 'accountHolderName',
          extractedValue: cleanName,
          normalizedValue: cleanName.toUpperCase(),
          extractionMethod: 'LABEL_PROXIMITY',
          sourcePage: page.pageNumber,
          sourceTextSnippet: getContextSnippet(page.text, match.index, match[0].length),
          confidenceIndicator: 'MEDIUM',
          alternativeCandidates: [],
        };
      }
    }
  }

  return null;
}

/**
 * Extracts bank branch name
 */
function extractBranchName(pages, fullText) {
  const patterns = [
    /(?:Branch\s*Name|Branch)[\s.:/—-]+([A-Za-z\s.,]{3,40})(?:\n|\r|,|IFSC)/i,
  ];

  for (const page of pages) {
    for (const pat of patterns) {
      const match = page.text.match(pat);
      if (match && match[1].trim().length > 2) {
        const val = match[1].trim().replace(/\s+/g, ' ');
        return {
          fieldName: 'branchName',
          extractedValue: val,
          normalizedValue: val.toUpperCase(),
          extractionMethod: 'LABEL_PROXIMITY',
          sourcePage: page.pageNumber,
          sourceTextSnippet: getContextSnippet(page.text, match.index, match[0].length),
          confidenceIndicator: 'MEDIUM',
          alternativeCandidates: [],
        };
      }
    }
  }

  return null;
}

/**
 * Helper to capture a snippet of context text around a match
 */
function getContextSnippet(text, index, matchLen) {
  if (!text || index === undefined || index < 0) return '';
  const start = Math.max(0, index - 25);
  const end = Math.min(text.length, index + matchLen + 25);
  let snippet = text.substring(start, end).replace(/[\r\n]+/g, ' ').trim();
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet;
}
