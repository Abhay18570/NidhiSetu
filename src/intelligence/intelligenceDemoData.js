/**
 * NidhiSetu Document Intelligence — Deterministic Synthetic Demo Data & Fixtures
 * Provides controlled OCR text fixtures for testing and explicit demo evaluation:
 * - Perfect field match
 * - Deposit amount mismatch
 * - Maturity date mismatch
 * - Missing IFSC
 * - Duplicate document hash
 * - Unreadable / low resolution scan
 * - Multiple conflicting OCR candidates
 *
 * NOTE: All fixtures are explicitly flagged as SYNTHETIC. Real uploads run through the OCR engine.
 */

import { documentAnalysisRepository } from '../storage/documentAnalysisRepository';
import { intelligenceReviewRepository } from '../storage/intelligenceReviewRepository';
import { fdrRepository } from '../storage/fdrRepository';
import { compareFields } from './fieldComparator';
import { detectDuplicateFingerprint } from './duplicateDetector';
import { generateFindings } from './anomalyEngine';
import { buildAnalysisReport } from './analysisReportBuilder';
import { extractFdrFields } from './fdrFieldExtractor';

export const SYNTHETIC_OCR_FIXTURES = {
  // 1. Perfect Match (Matches fdr-demo-01: SBI, Rs. 35,00,000, IFSC SBIN0001110)
  PERFECT_MATCH: `
STATE BANK OF INDIA
SHIVAJINAGAR COMMERCIAL BRANCH, PUNE
F.C. ROAD, SHIVAJINAGAR, PUNE - 411004
IFSC CODE: SBIN0001110
TERM DEPOSIT ADVICE / FIXED DEPOSIT RECEIPT
RECEIPT NO: SBI-FDR-9812401
IN FAVOUR OF: PRINCIPAL, COEP JOINTLY WITH RO, AICTE
DATE OF DEPOSIT: 15/08/2024
MATURITY DATE: 15/08/2029
PRINCIPAL AMOUNT: RS. 35,00,000.00
RUPEES THIRTY FIVE LAKHS ONLY
RATE OF INTEREST: 7.10% P.A.
SECURITY LIEN CLAUSE: ENDORSED IN FAVOUR OF AICTE
`.trim(),

  // 2. Deposit Amount Mismatch (Document shows Rs 30,00,000 while submission was Rs 35,00,000)
  AMOUNT_MISMATCH: `
STATE BANK OF INDIA
SHIVAJINAGAR COMMERCIAL BRANCH, PUNE
IFSC: SBIN0001110
FIXED DEPOSIT RECEIPT NO: SBI-FDR-9812401
ACCOUNT HOLDER: PRINCIPAL, COEP JOINTLY WITH RO, AICTE
DATE OF ISSUE: 15/08/2024
MATURITY DATE: 15/08/2029
DEPOSIT AMOUNT: RS. 30,00,000.00
RUPEES THIRTY LAKHS ONLY
INTEREST RATE: 7.10%
`.trim(),

  // 3. Maturity Date Mismatch (Document shows 2027 while submission claimed 2029)
  MATURITY_DATE_MISMATCH: `
BANK OF BARODA
DECCAN GYMKHANA BRANCH, PUNE
IFSC: BARB0DECCAN
FIXED DEPOSIT RECEIPT: BOB-FDR-5541290
NAME: PRINCIPAL, COEP JOINTLY WITH REGIONAL OFFICER, AICTE
DATE OF DEPOSIT: 10/01/2025
MATURITY DATE: 10/01/2027
DEPOSIT AMOUNT: RS. 15,00,000.00
RATE OF INTEREST: 6.85% P.A.
`.trim(),

  // 4. Missing IFSC code
  MISSING_IFSC: `
PUNJAB NATIONAL BANK
TT NAGAR BRANCH, BHPOAL
FIXED DEPOSIT RECEIPT: PNB-BHO-884129
ACCOUNT: SECRETARY, SARASWATI EDUCATION TRUST JOINTLY WITH RO, AICTE
DATE OF DEPOSIT: 01/11/2024
MATURITY DATE: 01/11/2027
PRINCIPAL SUM: RS. 25,00,000.00
INTEREST RATE: 7.25%
`.trim(),

  // 5. Unreadable / Garbled scan
  UNREADABLE_SCAN: '~#^% ... bk.. ?? ... [unreadable artifact scan]',

  // 6. Multiple conflicting OCR candidates
  MULTIPLE_CANDIDATES: `
CANARA BANK
MG ROAD BRANCH, BANGALORE
FIXED DEPOSIT RECEIPT NO: CNRB-DEP-11029
SUBSEQUENT ADVICE NO: CNRB-DEP-99411
OLD CERTIFICATE REF: CNRB-DEP-00124
DATE OF DEPOSIT: 05/03/2024
MATURITY DATE: 05/03/2029
INITIAL PRINCIPAL: RS. 10,00,000.00
REVISED PRINCIPAL: RS. 12,50,000.00
INTEREST RATE: 7.00%
`.trim(),
};

/**
 * Loads predefined synthetic demo intelligence analyses onto existing demo FDR records.
 * Explicitly invoked through demo controls or tests.
 */
export async function loadDemoAnalyses() {
  const allFdrs = await fdrRepository.getAllFDRs();
  if (!allFdrs || allFdrs.length === 0) return { loaded: 0, message: 'No FDR records found in repository.' };

  const demoScenarios = [
    {
      fdrId: 'fdr-demo-01',
      fixtureText: SYNTHETIC_OCR_FIXTURES.PERFECT_MATCH,
      desc: 'Perfect Match Scenario',
    },
    {
      fdrId: 'fdr-demo-02',
      fixtureText: SYNTHETIC_OCR_FIXTURES.AMOUNT_MISMATCH,
      desc: 'Deposit Amount Mismatch Scenario',
    },
    {
      fdrId: 'fdr-demo-03',
      fixtureText: SYNTHETIC_OCR_FIXTURES.MISSING_IFSC,
      desc: 'Missing IFSC Code Scenario',
    },
    {
      fdrId: 'fdr-demo-04',
      fixtureText: SYNTHETIC_OCR_FIXTURES.MATURITY_DATE_MISMATCH,
      desc: 'Maturity Date Discrepancy Scenario',
    },
    {
      fdrId: 'fdr-demo-05',
      fixtureText: SYNTHETIC_OCR_FIXTURES.UNREADABLE_SCAN,
      desc: 'Unreadable Scan Scenario',
    },
  ];

  let count = 0;

  for (const item of demoScenarios) {
    const fdr = allFdrs.find((f) => f.id === item.fdrId);
    if (!fdr) continue;

    const extractedFields = extractFdrFields(item.fixtureText, 1);
    const comparisonOutput = compareFields(extractedFields, fdr);
    const duplicateReport = detectDuplicateFingerprint(fdr.sha256Hash, fdr, allFdrs);

    const words = item.fixtureText.trim().split(/\s+/).filter(Boolean);
    const extractionMeta = {
      sourceType: 'SYNTHETIC_DEMO_FIXTURE',
      fileName: fdr.fileName || 'demo_receipt.pdf',
      pageCount: 1,
      wordCount: words.length,
      isUnreadable: words.length < 10,
      rawSampleSnippet: item.fixtureText.slice(0, 150),
      processingDurationMs: 420,
    };

    const findings = generateFindings(comparisonOutput, duplicateReport, extractionMeta, fdr);

    const report = buildAnalysisReport({
      fdrRecord: fdr,
      extractedFields,
      comparisonOutput,
      duplicateReport,
      findings,
      extractionMetadata: extractionMeta,
      processingDurationMs: 420,
    });

    report.isSyntheticDemo = true;
    await documentAnalysisRepository.saveAnalysis(report);

    // Initialize open review items for any findings
    for (const f of findings) {
      await intelligenceReviewRepository.getOrCreateReview(f.findingId, report.analysisId, fdr.id);
    }

    count++;
  }

  return {
    loaded: count,
    message: `Successfully loaded ${count} synthetic Document Intelligence demo reports.`,
  };
}

/**
 * Cleans up only synthetic demo analysis records without touching user records.
 */
export async function clearDemoAnalyses() {
  const allAnalyses = await documentAnalysisRepository.getAllAnalyses();
  const keep = allAnalyses.filter((a) => !a.isSyntheticDemo && !a.fdrId?.startsWith('fdr-demo-'));
  await documentAnalysisRepository.clearAllAnalyses();
  for (const item of keep) {
    await documentAnalysisRepository.saveAnalysis(item);
  }
}
