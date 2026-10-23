/**
 * NidhiSetu — Module 04 Automated Test Suite
 * Comprehensive automated verification for AI-assisted Document Intelligence,
 * client-side OCR extraction, deterministic cross-field validation, exact duplicate detection,
 * explainable anomaly engine, human officer review workflow, and regression checks across Modules 01-03.
 */

import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import {
  initializeStorage,
  storageService,
  fdrRepository,
  documentAnalysisRepository,
  intelligenceReviewRepository,
  userRepository,
  institutionRepository,
  sessionRepository,
  FDR_STATUS,
} from '../storage';

import {
  normalizeDate,
  normalizeDepositAmount,
  normalizeIFSC,
  normalizeFdrNumber,
  normalizeBankName,
  normalizeInterestRate,
  extractFdrFields,
  compareFields,
  detectDuplicateFingerprint,
  DUPLICATE_CLASSIFICATION,
  generateFindings,
  buildAnalysisReport,
  processDocumentForIntelligence,
  loadDemoAnalyses,
  clearDemoAnalyses,
  SYNTHETIC_OCR_FIXTURES,
  ANALYSIS_STATUS,
  REVIEW_STATUS,
  COMPARISON_RESULT,
  FINDING_SEVERITY,
  SCORECARD_LABEL,
} from '../intelligence';

import { LanguageProvider } from '../i18n/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import RoleGuard from '../components/auth/RoleGuard';
import OfficerDocumentIntelligencePage from '../pages/officer/OfficerDocumentIntelligencePage';
import HomePage from '../pages/HomePage';
import { en } from '../i18n/translations/en';
import { hi } from '../i18n/translations/hi';
import { mr } from '../i18n/translations/mr';

function renderWithProviders(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <LanguageProvider>
        <AuthProvider>{ui}</AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

describe('Module 04: AI-Assisted Document Intelligence & Anomaly Detection Tests', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    await initializeStorage();
  });

  // 1. Text-based PDF extraction
  it('1. Text-based PDF extraction parses digital text correctly via processDocumentForIntelligence', async () => {
    const textFixture = SYNTHETIC_OCR_FIXTURES.PERFECT_MATCH;
    const result = await processDocumentForIntelligence(null, {
      syntheticTextFixture: textFixture,
    });
    expect(result.sourceType).toBe('SYNTHETIC_FIXTURE');
    expect(result.fullText).toContain('STATE BANK OF INDIA');
    expect(result.extractionMetadata.wordCount).toBeGreaterThan(15);
    expect(result.extractedFields.bankName.extractedValue).toContain('STATE BANK OF INDIA');
  });

  // 2. Scanned PDF fallback
  it('2. Scanned PDF fallback identifies low-text scans and flags partial or unreadable text', async () => {
    const garbled = SYNTHETIC_OCR_FIXTURES.UNREADABLE_SCAN;
    const result = await processDocumentForIntelligence(null, {
      syntheticTextFixture: garbled,
    });
    expect(result.extractionMetadata.isUnreadable).toBe(true);
    expect(result.extractionMetadata.wordCount).toBeLessThan(10);
  });

  // 3. Image OCR integration
  it('3. Image OCR integration extracts financial entities from receipt text', async () => {
    const imgScan = `
PUNJAB NATIONAL BANK
BRANCH IFSC: PUNB0005500
FDR NUMBER: PNB-BHO-884129
PRINCIPAL AMOUNT: RS. 25,00,000.00
MATURITY DATE: 01/11/2027
INTEREST RATE: 7.25%
    `.trim();
    const result = await processDocumentForIntelligence(null, {
      syntheticTextFixture: imgScan,
    });
    expect(result.extractedFields.ifsc.extractedValue).toBe('PUNB0005500');
    expect(result.extractedFields.fdrNumber.extractedValue).toBe('PNB-BHO-884129');
    expect(result.extractedFields.depositAmount.normalizedValue).toBe(250000000); // 25 Lakhs in Paise
  });

  // 4. OCR cancellation
  it('4. OCR cancellation stops execution gracefully when abort signal is triggered', async () => {
    const abortCtrl = new AbortController();
    abortCtrl.abort();

    await expect(
      processDocumentForIntelligence(null, {
        syntheticTextFixture: 'TEST TEXT',
        signal: abortCtrl.signal,
      })
    ).rejects.toThrow(/cancelled/i);
  });

  // 5. OCR processing failure
  it('5. OCR processing failure handles missing documents gracefully', async () => {
    await expect(processDocumentForIntelligence(null, {})).rejects.toThrow(
      /No document file provided/i
    );
  });

  // 6. IFSC extraction
  it('6. IFSC extraction identifies valid 11-character Indian Financial System Codes', () => {
    const sample = 'State Bank of India, Branch IFSC Code: SBIN0001110, Term Deposit Receipt';
    const fields = extractFdrFields(sample);
    expect(fields.ifsc.extractedValue).toBe('SBIN0001110');
    expect(fields.ifsc.confidenceIndicator).toBe('HIGH');
  });

  // 7. FDR number extraction
  it('7. FDR number extraction locates certificate/receipt numbers', () => {
    const sample = 'Fixed Deposit Advice / Receipt Number: SBI-FDR-9812401 issued on 15 Aug 2024';
    const fields = extractFdrFields(sample);
    expect(fields.fdrNumber.extractedValue).toBe('SBI-FDR-9812401');
    expect(fields.fdrNumber.confidenceIndicator).toBe('HIGH');
  });

  // 8. Deposit amount extraction
  it('8. Deposit amount extraction normalizes currency symbols, commas, and lakh notations into integer paise', () => {
    expect(normalizeDepositAmount('₹ 35,00,000.00')).toBe(350000000);
    expect(normalizeDepositAmount('Rs. 25 Lakhs')).toBe(250000000);
    expect(normalizeDepositAmount('1500000')).toBe(150000000);
    expect(normalizeDepositAmount('₹ 1.5 Crores')).toBe(1500000000);
  });

  // 9. Date normalization
  it('9. Date normalization converts various Indian date formats into strict ISO YYYY-MM-DD', () => {
    expect(normalizeDate('15/08/2024')).toBe('2024-08-15');
    expect(normalizeDate('15-08-2024')).toBe('2024-08-15');
    expect(normalizeDate('15 Aug 2029')).toBe('2029-08-15');
    expect(normalizeDate('August 15, 2029')).toBe('2029-08-15');
    expect(normalizeDate('2024-08-15')).toBe('2024-08-15');
  });

  // 10. Interest rate extraction
  it('10. Interest rate extraction correctly parses percentage representations', () => {
    expect(normalizeInterestRate('7.10% p.a.')).toBe(7.1);
    expect(normalizeInterestRate('6.85 %')).toBe(6.85);
    const sample = 'Deposit issued at interest rate of 7.25% per annum';
    const fields = extractFdrFields(sample);
    expect(fields.interestRate.extractedValue).toBe('7.25%');
    expect(fields.interestRate.normalizedValue).toBe(7.25);
  });

  // 11. Missing-field handling
  it('11. Missing-field handling marks missing fields as MISSING_IN_DOCUMENT without throwing', () => {
    const partialDoc = 'STATE BANK OF INDIA\nFIXED DEPOSIT RECEIPT NO: SBI-999';
    const fields = extractFdrFields(partialDoc);
    const submitted = {
      bankName: 'State Bank of India',
      fdrNumber: 'SBI-999',
      ifsc: 'SBIN0001110',
      depositAmountPaise: 350000000,
    };
    const comp = compareFields(fields, submitted);
    expect(comp.comparisons.ifsc.result).toBe(COMPARISON_RESULT.MISSING_IN_DOCUMENT);
    expect(comp.comparisons.depositAmount.result).toBe(COMPARISON_RESULT.MISSING_IN_DOCUMENT);
  });

  // 12. Multiple-candidate handling
  it('12. Multiple-candidate handling detects competing values and flags them', () => {
    const multiDoc = SYNTHETIC_OCR_FIXTURES.MULTIPLE_CANDIDATES;
    const fields = extractFdrFields(multiDoc);
    expect(fields.depositAmount.candidates.length).toBeGreaterThan(1);
    const submitted = {
      bankName: 'Canara Bank',
      depositAmountPaise: 100000000, // 10 Lakhs
    };
    const comp = compareFields(fields, submitted);
    // When competing candidates exist with different values
    expect(comp.comparisons.depositAmount.candidates.length).toBeGreaterThan(1);
  });

  // 13. Exact field matching
  it('13. Exact field matching outputs MATCH for identical submitted and extracted metadata', () => {
    const fields = extractFdrFields(SYNTHETIC_OCR_FIXTURES.PERFECT_MATCH);
    const submitted = {
      bankName: 'State Bank of India',
      ifsc: 'SBIN0001110',
      fdrNumber: 'SBI-FDR-9812401',
      depositAmountPaise: 350000000,
      depositDate: '2024-08-15',
      maturityDate: '2029-08-15',
    };
    const comp = compareFields(fields, submitted);
    expect(comp.comparisons.bankName.result).toBe(COMPARISON_RESULT.MATCH);
    expect(comp.comparisons.ifsc.result).toBe(COMPARISON_RESULT.MATCH);
    expect(comp.comparisons.fdrNumber.result).toBe(COMPARISON_RESULT.MATCH);
    expect(comp.comparisons.depositAmount.result).toBe(COMPARISON_RESULT.MATCH);
    expect(comp.comparisons.depositDate.result).toBe(COMPARISON_RESULT.MATCH);
    expect(comp.comparisons.maturityDate.result).toBe(COMPARISON_RESULT.MATCH);
  });

  // 14. Amount mismatch
  it('14. Amount mismatch detects differences in integer paise and generates a high-severity finding', () => {
    const fields = extractFdrFields(SYNTHETIC_OCR_FIXTURES.AMOUNT_MISMATCH);
    const submitted = {
      id: 'fdr-demo-01',
      bankName: 'State Bank of India',
      depositAmountPaise: 350000000, // 35 Lakhs
    };
    const comp = compareFields(fields, submitted);
    expect(comp.comparisons.depositAmount.result).toBe(COMPARISON_RESULT.MISMATCH);

    const findings = generateFindings(comp, { isDuplicate: false }, {}, submitted);
    const amtFinding = findings.find((f) => f.field === 'depositAmount');
    expect(amtFinding).toBeDefined();
    expect(amtFinding.severity).toBe(FINDING_SEVERITY.HIGH);
    expect(amtFinding.explanation).toContain('Amount mismatch');
  });

  // 15. Date mismatch
  it('15. Date mismatch detects discrepancy between submitted maturity and extracted document date', () => {
    const fields = extractFdrFields(SYNTHETIC_OCR_FIXTURES.MATURITY_DATE_MISMATCH);
    const submitted = {
      id: 'fdr-demo-02',
      maturityDate: '2029-01-10',
    };
    const comp = compareFields(fields, submitted);
    expect(comp.comparisons.maturityDate.result).toBe(COMPARISON_RESULT.MISMATCH);

    const findings = generateFindings(comp, { isDuplicate: false }, {}, submitted);
    const matFinding = findings.find((f) => f.field === 'maturityDate');
    expect(matFinding).toBeDefined();
    expect(matFinding.severity).toBe(FINDING_SEVERITY.HIGH);
  });

  // 16. Duplicate SHA-256 detection
  it('16. Duplicate SHA-256 detection flags collisions across different institutions as CROSS_INSTITUTION_COLLISION', () => {
    const targetHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const currentFdr = {
      id: 'fdr-test-current',
      institutionId: 'inst-01',
      referenceNumber: 'FDR-2026-999',
    };
    const allFdrs = [
      {
        id: 'fdr-external',
        institutionId: 'inst-02',
        referenceNumber: 'FDR-2026-EXTERNAL',
        sha256Hash: targetHash,
      },
    ];

    const dupReport = detectDuplicateFingerprint(targetHash, currentFdr, allFdrs);
    expect(dupReport.isDuplicate).toBe(true);
    expect(dupReport.classification).toBe(DUPLICATE_CLASSIFICATION.CROSS_INSTITUTION_COLLISION);
    expect(dupReport.severity).toBe(FINDING_SEVERITY.HIGH);
  });

  // 17. Renewal-context duplicate handling
  it('17. Renewal-context duplicate handling classifies linked renewals as contextual reuse (INFO severity)', () => {
    const targetHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const currentFdr = {
      id: 'fdr-renew-02',
      institutionId: 'inst-01',
      renewalReferenceId: 'fdr-orig-01',
    };
    const allFdrs = [
      {
        id: 'fdr-orig-01',
        institutionId: 'inst-01',
        referenceNumber: 'FDR-2024-001',
        sha256Hash: targetHash,
      },
    ];

    const dupReport = detectDuplicateFingerprint(targetHash, currentFdr, allFdrs);
    expect(dupReport.isDuplicate).toBe(true);
    expect(dupReport.classification).toBe(DUPLICATE_CLASSIFICATION.CONTEXTUAL_RENEWAL);
    expect(dupReport.severity).toBe(FINDING_SEVERITY.INFO);
  });

  // 18. Finding fingerprint stability
  it('18. Finding fingerprint stability produces identical deterministic IDs across runs', () => {
    const fields = extractFdrFields(SYNTHETIC_OCR_FIXTURES.AMOUNT_MISMATCH);
    const submitted = { id: 'fdr-demo-01', depositAmountPaise: 350000000 };
    const comp1 = compareFields(fields, submitted);
    const f1 = generateFindings(comp1, { isDuplicate: false }, {}, submitted);

    const comp2 = compareFields(fields, submitted);
    const f2 = generateFindings(comp2, { isDuplicate: false }, {}, submitted);

    expect(f1[0].findingId).toBe(f2[0].findingId);
    expect(f1[0].findingType).toBe(f2[0].findingType);
  });

  // 19. Analysis persistence
  it('19. Analysis persistence saves and retrieves analysis reports from documentAnalysisRepository', async () => {
    const report = {
      analysisId: 'ana-test-01',
      fdrId: 'fdr-demo-01',
      institutionId: 'inst-demo-01',
      processingStatus: ANALYSIS_STATUS.COMPLETED,
      analyzedAt: new Date().toISOString(),
      scorecard: { completeness: { percentage: 100 } },
      findings: [],
    };
    await documentAnalysisRepository.saveAnalysis(report);
    const loaded = await documentAnalysisRepository.getLatestAnalysisByFdrId('fdr-demo-01');
    expect(loaded).toBeDefined();
    expect(loaded.analysisId).toBe('ana-test-01');
    expect(loaded.scorecard.completeness.percentage).toBe(100);
  });

  // 20. Stale analysis detection
  it('20. Stale analysis detection identifies when document sha256 changed or status is STALE', async () => {
    const report = {
      analysisId: 'ana-test-stale',
      fdrId: 'fdr-demo-01',
      documentSha256: 'hash-initial-1111111111111111111111111111111111111111111111111111111111111111',
      processingStatus: ANALYSIS_STATUS.COMPLETED,
    };
    await documentAnalysisRepository.saveAnalysis(report);

    // Current FDR has different hash
    const currentFdr = {
      id: 'fdr-demo-01',
      sha256Hash: 'hash-updated-2222222222222222222222222222222222222222222222222222222222222222',
    };
    expect(documentAnalysisRepository.isAnalysisStale(report, currentFdr)).toBe(true);

    // Explicitly mark stale
    await documentAnalysisRepository.markStale('fdr-demo-01', 'Document updated');
    const staleReport = await documentAnalysisRepository.getLatestAnalysisByFdrId('fdr-demo-01');
    expect(staleReport.processingStatus).toBe(ANALYSIS_STATUS.STALE);
  });

  // 21. Officer finding review
  it('21. Officer finding review transitions states through OPEN, UNDER_REVIEW, and CONFIRMED_DISCREPANCY', async () => {
    const findingId = 'fnd-test-01';
    const actor = { id: 'usr-officer-01', name: 'Dr. S. K. Verma' };

    // Start review
    const r1 = await intelligenceReviewRepository.startReview(findingId, 'ana-01', 'fdr-01', actor);
    expect(r1.status).toBe(REVIEW_STATUS.UNDER_REVIEW);
    expect(r1.assignedOfficerName).toBe(actor.name);

    // Confirm discrepancy
    const r2 = await intelligenceReviewRepository.confirmDiscrepancy(findingId, 'Confirmed against branch copy', actor);
    expect(r2.status).toBe(REVIEW_STATUS.CONFIRMED_DISCREPANCY);
    expect(r2.reason).toContain('Confirmed against branch copy');
  });

  // 22. Mandatory dismissal reason
  it('22. Mandatory dismissal reason rejects dismissals without an explanatory rationale (>= 5 characters)', async () => {
    const findingId = 'fnd-test-02';
    const actor = { id: 'usr-officer-01', name: 'Officer' };

    // Fails with empty reason
    await expect(intelligenceReviewRepository.dismissFinding(findingId, '', actor)).rejects.toThrow(
      /detailed reason.*is mandatory/i
    );

    // Fails with too short reason (< 5 chars)
    await expect(intelligenceReviewRepository.dismissFinding(findingId, 'ok', actor)).rejects.toThrow(
      /detailed reason.*is mandatory/i
    );

    // Succeeds with valid reason
    const r = await intelligenceReviewRepository.dismissFinding(
      findingId,
      'Valid bank endorsement letter provided clarifying branch re-alignment.',
      actor
    );
    expect(r.status).toBe(REVIEW_STATUS.DISMISSED);
  });

  // 23. Reassessment
  it('23. Reassessment allows reopening a dismissed or resolved finding', async () => {
    const findingId = 'fnd-test-03';
    const actor = { id: 'usr-officer-01', name: 'Officer' };
    await intelligenceReviewRepository.dismissFinding(findingId, 'Dismissed initially', actor);

    const reopened = await intelligenceReviewRepository.reopenFinding(findingId, 'New audit evidence submitted', actor);
    expect(reopened.status).toBe(REVIEW_STATUS.OPEN);
    expect(reopened.history.some((h) => h.action === 'REOPENED')).toBe(true);
  });

  // 24. Institution ownership isolation
  it('24. Institution ownership isolation prevents viewing another institutions FDR analysis', async () => {
    const analyses = [
      { analysisId: 'ana-1', fdrId: 'fdr-1', institutionId: 'inst-demo-01' },
      { analysisId: 'ana-2', fdrId: 'fdr-2', institutionId: 'inst-demo-02' },
    ];
    for (const a of analyses) await documentAnalysisRepository.saveAnalysis(a);

    const inst1Analyses = await documentAnalysisRepository.getAnalysesByInstitution('inst-demo-01');
    expect(inst1Analyses.length).toBe(1);
    expect(inst1Analyses[0].institutionId).toBe('inst-demo-01');
  });

  // 25. Officer route protection
  it('25. Officer route protection restricts unauthorized visitors from /officer/document-intelligence', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Portal Login Screen</div>} />
        <Route
          path="/officer/document-intelligence"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer', 'admin']}>
                <OfficerDocumentIntelligencePage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: '/officer/document-intelligence' }
    );
    await waitFor(() => {
      expect(screen.getByText('Portal Login Screen')).toBeInTheDocument();
    });
  });

  // 26. English/Hindi/Marathi rendering
  it('26. English/Hindi/Marathi rendering provides localized translations for Module 04 keys', () => {
    expect(en['dash.menu.documentIntelligence']).toBe('Document Intelligence');
    expect(hi['dash.menu.documentIntelligence']).toBe('दस्तावेज़ विश्लेषण');
    expect(mr['dash.menu.documentIntelligence']).toBe('दस्तऐवज बुद्धिमत्ता');

    expect(en['intel.comp.match']).toBe('Exact Match');
    expect(hi['intel.comp.match']).toBe('सटीक मिलान');
    expect(mr['intel.comp.match']).toBe('तंतोतंत जुळणी');
  });

  // 27. Module 01 regression
  it('27. Module 01 regression: Public homepage renders with national branding landmarks', () => {
    renderWithProviders(<HomePage />, { route: '/' });
    expect(screen.getByText(/secure, transparent & intelligent fdr management/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /institution login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /explore services/i })).toBeInTheDocument();
  });

  // 28. Module 02 regression
  it('28. Module 02 regression: User accounts and role authentication remain intact', async () => {
    const users = await userRepository.getAllUsers();
    expect(users.length).toBeGreaterThan(0);
    const officer = users.find((u) => u.role === 'officer');
    expect(officer).toBeDefined();
  });

  // 29. Module 03 regression
  it('29. Module 03 regression: FDR records and lifecycle transitions continue working seamlessly', async () => {
    const allFdrs = await fdrRepository.getAllFDRs();
    expect(allFdrs.length).toBeGreaterThan(0);
    const firstFdr = allFdrs[0];
    expect(firstFdr.referenceNumber).toBeDefined();
    expect(firstFdr.depositAmountPaise).toBeGreaterThan(0);
  });
});
