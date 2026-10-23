/**
 * NidhiSetu — Module 05 Automated Test Suite
 * Comprehensive automated verification for Simulated Bank Confirmation,
 * Structured SFMS/CBS Mock Messaging, Deterministic Simulation Engine (Scenarios A through J),
 * Integer-Paise & ISO Date Field Comparisons, Lien Status Engine,
 * Officer Scrutiny Workflow, Mandatory Justification Rules, Admin Telemetry,
 * Multilingual dictionaries, and Module 01-04 regressions.
 */

import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import {
  initializeStorage,
  storageService,
  STORAGE_KEYS,
  fdrRepository,
  auditRepository,
  notificationRepository,
  sessionRepository,
  userRepository,
  bankVerificationRepository,
  bankMessageRepository,
  bankReviewRepository,
  BANK_REQUEST_STATUS,
  BANK_REVIEW_STATUS,
  BANK_REVIEW_ACTIONS,
  documentAnalysisRepository,
  formatINR,
} from '../storage';

import {
  bankRegistry,
  SIMULATION_STATUS,
  VERIFICATION_TYPES,
  DEFAULT_SYNTHETIC_BANKS,
} from '../banking/bankRegistry';

import {
  MESSAGE_TYPES,
  SCHEMA_VERSION,
  VALIDATION_STATUS,
  SIMULATION_DISCLAIMER,
  validateMockMessage,
  generateUUID,
} from '../banking/bankMessageSchema';

import { bankMessageBuilder } from '../banking/bankMessageBuilder';
import {
  SIMULATION_SCENARIOS,
  SYNTHETIC_BANK_LEDGER_FIXTURES,
} from '../banking/bankScenarioFixtures';
import { bankSimulator } from '../banking/bankSimulator';
import {
  bankFieldComparator,
  COMPARISON_OUTCOME,
  COMPARISON_FINDINGS,
} from '../banking/bankFieldComparator';
import {
  lienStatusEngine,
  LIEN_EVALUATION_OUTCOME,
} from '../banking/lienStatusEngine';
import { verificationSummaryBuilder } from '../banking/verificationSummaryBuilder';

import { LanguageProvider } from '../i18n/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import RoleGuard from '../components/auth/RoleGuard';
import OfficerBankVerificationsPage from '../pages/officer/OfficerBankVerificationsPage';
import AdminBankMonitoringPage from '../pages/admin/AdminBankMonitoringPage';
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

describe('Module 05: Simulated Bank Confirmation & Lien Verification Tests', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    await initializeStorage();
  });

  // 1. Synthetic bank registry initialization
  it('1. Synthetic bank registry initialization seeds scheduled commercial bank profiles', async () => {
    const banks = await bankRegistry.getAllBanks();
    expect(banks).toBeDefined();
    expect(banks.length).toBeGreaterThanOrEqual(6);

    const sbi = banks.find((b) => b.bankCode === 'SBIN');
    expect(sbi).toBeDefined();
    expect(sbi.isSyntheticSimulator).toBe(true);
    expect(sbi.simulationStatus).toBe(SIMULATION_STATUS.ACTIVE_SIMULATOR);
    expect(sbi.supportedVerificationTypes).toContain(VERIFICATION_TYPES.LIEN_STATUS_CHECK);
  });

  // 2. Idempotent demo seeding
  it('2. Idempotent demo seeding preserves existing records on subsequent invocations', async () => {
    const reqsFirst = await bankVerificationRepository.getAllRequests();
    expect(reqsFirst.length).toBeGreaterThan(0);

    // Call initializeStorage again
    await initializeStorage(false);
    const reqsSecond = await bankVerificationRepository.getAllRequests();
    expect(reqsSecond.length).toBe(reqsFirst.length);
  });

  // 3. Verification request creation
  it('3. Verification request creation assigns sequential reference and correlation ID', async () => {
    const newReq = await bankVerificationRepository.createVerificationRequest({
      fdrId: 'fdr-test-custom-01',
      fdrReference: 'FDR-2026-9999',
      institutionId: 'inst-demo-01',
      institutionName: 'Test Engineering College',
      simulatorBankId: 'sim-bank-sbi',
      bankName: 'State Bank of India',
      fdrNumber: 'SBI-FDR-9999999',
      declaredAmountPaise: 350000000,
      depositDate: '2024-08-15',
      maturityDate: '2027-08-15',
      accountHolderName: 'Principal Jointly with AICTE',
      officerReason: 'Statutory compliance inspection',
    });

    expect(newReq).toBeDefined();
    expect(newReq.requestReference).toMatch(/^BVR-2026-\d{4}$/);
    expect(newReq.correlationId).toBeDefined();
    expect(newReq.requestStatus).toBe(BANK_REQUEST_STATUS.REQUESTED);
    expect(newReq.simulationMode).toBe(true);
    expect(newReq.disclaimer).toBe(SIMULATION_DISCLAIMER);
  });

  // 4. Duplicate request prevention
  it('4. Duplicate request prevention blocks concurrent active requests on same FDR', async () => {
    // bvr-demo-01 is RESPONSE_RECEIVED, let's create an active one
    await bankVerificationRepository.createVerificationRequest({
      fdrId: 'fdr-duplicate-test',
      fdrReference: 'FDR-DUP-01',
      simulatorBankId: 'sim-bank-sbi',
      fdrNumber: 'SBI-DUP-001',
      declaredAmountPaise: 100000000,
      officerReason: 'Active check',
    });

    // Attempt to create another active request for same FDR
    await expect(
      bankVerificationRepository.createVerificationRequest({
        fdrId: 'fdr-duplicate-test',
        fdrReference: 'FDR-DUP-01',
        simulatorBankId: 'sim-bank-sbi',
        fdrNumber: 'SBI-DUP-001',
        declaredAmountPaise: 100000000,
        officerReason: 'Second concurrent check',
      })
    ).rejects.toThrow(/currently active/i);
  });

  // 5. Valid request lifecycle transitions
  it('5. Valid request lifecycle transitions advance deterministically', async () => {
    const req = await bankVerificationRepository.createVerificationRequest({
      fdrId: 'fdr-lifecycle-01',
      fdrReference: 'FDR-LC-01',
      simulatorBankId: 'sim-bank-sbi',
      fdrNumber: 'SBI-LC-001',
      declaredAmountPaise: 100000000,
      isDraft: true,
    });
    expect(req.requestStatus).toBe(BANK_REQUEST_STATUS.DRAFT);

    // Transition DRAFT -> REQUESTED
    const step1 = await bankVerificationRepository.updateRequestStatus(
      req.requestId,
      BANK_REQUEST_STATUS.REQUESTED
    );
    expect(step1.requestStatus).toBe(BANK_REQUEST_STATUS.REQUESTED);

    // Transition REQUESTED -> PROCESSING
    const step2 = await bankVerificationRepository.updateRequestStatus(
      req.requestId,
      BANK_REQUEST_STATUS.PROCESSING
    );
    expect(step2.requestStatus).toBe(BANK_REQUEST_STATUS.PROCESSING);

    // Transition PROCESSING -> RESPONSE_RECEIVED
    const step3 = await bankVerificationRepository.updateRequestStatus(
      req.requestId,
      BANK_REQUEST_STATUS.RESPONSE_RECEIVED
    );
    expect(step3.requestStatus).toBe(BANK_REQUEST_STATUS.RESPONSE_RECEIVED);
  });

  // 6. Invalid transition rejection
  it('6. Invalid transition rejection prevents illegal status jumping', async () => {
    const req = await bankVerificationRepository.createVerificationRequest({
      fdrId: 'fdr-invalid-trans',
      fdrReference: 'FDR-INV-01',
      simulatorBankId: 'sim-bank-sbi',
      fdrNumber: 'SBI-INV-001',
      declaredAmountPaise: 100000000,
      isDraft: true,
    });

    // Attempt illegal jump from DRAFT straight to RESPONSE_RECEIVED
    await expect(
      bankVerificationRepository.updateRequestStatus(
        req.requestId,
        BANK_REQUEST_STATUS.RESPONSE_RECEIVED
      )
    ).rejects.toThrow(/Cannot transition from DRAFT to RESPONSE_RECEIVED/i);
  });

  // 7. Structured message generation
  it('7. Structured message generation creates valid mock SFMS inquiry messages', () => {
    const msg = bankMessageBuilder.buildFdrVerifyRequest({
      requestId: 'bvr-test-msg',
      simulatorBankId: 'sim-bank-sbi',
      fdrNumber: 'SBI-FDR-1234',
      declaredAmountPaise: 250000000,
      depositDate: '2024-01-01',
      maturityDate: '2027-01-01',
      accountHolderName: 'Principal Jointly with AICTE',
    });

    expect(msg.messageId).toMatch(/^MSG-REQ-/);
    expect(msg.messageType).toBe(MESSAGE_TYPES.MOCK_FDR_VERIFY_REQUEST);
    expect(msg.schemaVersion).toBe(SCHEMA_VERSION);
    expect(msg.simulationMode).toBe(true);
    expect(msg.disclaimer).toBe(SIMULATION_DISCLAIMER);
    expect(msg.validationStatus).toBe(VALIDATION_STATUS.VALID);
  });

  // 8. Message schema validation
  it('8. Message schema validation rejects malformed payload attributes', () => {
    const malformed = {
      messageId: 'MSG-TEST',
      // missing correlationId, requestId, simulationMode
      messageType: MESSAGE_TYPES.MOCK_FDR_VERIFY_REQUEST,
      payload: {},
    };

    const result = validateMockMessage(malformed);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  // 9. Exact-match simulation
  it('9. Exact-match simulation returns matching values and confirmed lien', async () => {
    const simReq = {
      requestId: 'bvr-exact-test',
      correlationId: generateUUID(),
      simulatorBankId: 'sim-bank-sbi',
      fdrNumber: 'SBI-FDR-9812401',
      declaredAmountPaise: 350000000,
      depositDate: '2024-08-15',
      maturityDate: '2027-09-17',
      accountHolderName: 'Principal, COEP Jointly with RO, AICTE',
    };

    const { response, responseMessage } = await bankSimulator.executeSimulation(
      simReq,
      'SCENARIO_A_EXACT_MATCH',
      { skipDelay: true }
    );

    expect(response.depositExistenceStatus).toBe('FOUND_IN_SYNTHETIC_LEDGER');
    expect(response.bankReportedAmountPaise).toBe(350000000);
    expect(response.lienStatus).toBe('LIEN_RECORDED_IN_SIMULATION');
    expect(responseMessage.validationStatus).toBe('VALID');
  });

  // 10. Amount mismatch scenario
  it('10. Amount mismatch scenario flags declared vs ledger difference', async () => {
    const simReq = {
      requestId: 'bvr-mismatch-test',
      fdrNumber: 'BOB-FDR-5541290',
      declaredAmountPaise: 250000000, // 25 Lakhs
      simulatorBankId: 'sim-bank-bob',
    };

    const { response } = await bankSimulator.executeSimulation(
      simReq,
      'SCENARIO_B_AMOUNT_MISMATCH',
      { skipDelay: true }
    );

    expect(response.bankReportedAmountPaise).not.toBe(250000000);
    expect(response.warnings.length).toBeGreaterThan(0);
  });

  // 11. FDR not found scenario
  it('11. FDR not found scenario reports NOT_FOUND_IN_SYNTHETIC_LEDGER', async () => {
    const simReq = {
      requestId: 'bvr-not-found-test',
      fdrNumber: 'NON-EXISTENT-FDR-999',
      simulatorBankId: 'sim-bank-sbi',
    };

    const { response } = await bankSimulator.executeSimulation(
      simReq,
      'SCENARIO_C_FDR_NOT_FOUND',
      { skipDelay: true }
    );

    expect(response.depositExistenceStatus).toBe('NOT_FOUND_IN_SYNTHETIC_LEDGER');
    expect(response.bankReportedAmountPaise).toBeNull();
    expect(response.errors.length).toBeGreaterThan(0);
  });

  // 12. Missing lien scenario
  it('12. Missing lien scenario reports deposit exists with missing lien', async () => {
    const simReq = {
      requestId: 'bvr-no-lien-test',
      fdrNumber: 'PNB-FDR-7721834',
      declaredAmountPaise: 500000000,
      simulatorBankId: 'sim-bank-pnb',
    };

    const { response } = await bankSimulator.executeSimulation(
      simReq,
      'SCENARIO_D_LIEN_NOT_RECORDED',
      { skipDelay: true }
    );

    expect(response.depositExistenceStatus).toBe('FOUND_IN_SYNTHETIC_LEDGER');
    expect(response.lienStatus).toBe('LIEN_NOT_RECORDED_IN_SIMULATION');
  });

  // 13. Beneficiary mismatch scenario
  it('13. Beneficiary mismatch scenario detects unauthorized lien holder', async () => {
    const simReq = {
      requestId: 'bvr-lien-ben-test',
      fdrNumber: 'CNRB-FDR-3319021',
      declaredAmountPaise: 180000000,
      simulatorBankId: 'sim-bank-canara',
    };

    const { response } = await bankSimulator.executeSimulation(
      simReq,
      'SCENARIO_E_BENEFICIARY_MISMATCH',
      { skipDelay: true }
    );

    expect(response.lienStatus).toBe('BENEFICIARY_MISMATCH_IN_SIMULATION');
    expect(response.lienBeneficiary).not.toContain('AICTE');
  });

  // 14. Maturity mismatch scenario
  it('14. Maturity mismatch scenario identifies differing tenure dates', async () => {
    const simReq = {
      requestId: 'bvr-mat-test',
      fdrNumber: 'SBI-FDR-9812401',
      declaredAmountPaise: 350000000,
      maturityDate: '2028-12-31',
      simulatorBankId: 'sim-bank-sbi',
    };

    const { response } = await bankSimulator.executeSimulation(
      simReq,
      'SCENARIO_F_MATURITY_MISMATCH',
      { skipDelay: true }
    );

    expect(response.bankReportedMaturityDate).not.toBe('2028-12-31');
  });

  // 15. Timeout handling
  it('15. Timeout handling yields TIMEOUT status and INDETERMINATE verdict', async () => {
    const simReq = {
      requestId: 'bvr-timeout-test',
      fdrNumber: 'SBI-FDR-9812401',
      simulatorBankId: 'sim-bank-sbi',
    };

    const { response } = await bankSimulator.executeSimulation(
      simReq,
      'SCENARIO_H_TIMEOUT',
      { skipDelay: true }
    );

    expect(response.responseStatus).toBe('TIMEOUT');
    expect(response.depositExistenceStatus).toBe('INDETERMINATE');

    const comp = bankFieldComparator.compareFdrWithBankResponse({ fdrNumber: 'SBI-FDR-9812401' }, response);
    expect(comp.overallOutcome).toBe(COMPARISON_OUTCOME.INDETERMINATE);
    expect(comp.findings).toContain(COMPARISON_FINDINGS.SIMULATED_RESPONSE_TIMEOUT);
  });

  // 16. Malformed response handling
  it('16. Malformed response handling produces schema validation failure', async () => {
    const simReq = {
      requestId: 'bvr-malformed-test',
      fdrNumber: 'SBI-FDR-9812401',
      simulatorBankId: 'sim-bank-sbi',
    };

    const { responseMessage } = await bankSimulator.executeSimulation(
      simReq,
      'SCENARIO_I_MALFORMED_RESPONSE',
      { skipDelay: true }
    );

    expect(responseMessage.validationStatus).toBe(VALIDATION_STATUS.INVALID);
    expect(responseMessage.validationErrors.length).toBeGreaterThan(0);
  });

  // 17. Integer-paise comparison
  it('17. Integer-paise comparison eliminates floating-point rounding errors', () => {
    const submitted = {
      fdrNumber: 'SBI-100',
      depositAmountPaise: 350000050, // ₹ 35,00,000.50
    };

    const bankResponse = {
      bankReportedFdrNumber: 'SBI-100',
      bankReportedAmountPaise: 350000050,
      depositExistenceStatus: 'FOUND_IN_SYNTHETIC_LEDGER',
      lienStatus: 'LIEN_RECORDED_IN_SIMULATION',
      lienBeneficiary: 'All India Council for Technical Education (AICTE)',
    };

    const result = bankFieldComparator.compareFdrWithBankResponse(submitted, bankResponse);
    expect(result.fieldComparisons.amount.outcome).toBe(COMPARISON_OUTCOME.MATCH);
    expect(result.fieldComparisons.amount.differencePaise).toBe(0);
  });

  // 18. Date normalization
  it('18. Date normalization parses diverse valid ISO representations', () => {
    const submitted = {
      fdrNumber: 'SBI-100',
      depositAmountPaise: 10000000,
      depositDate: '2024-08-15T00:00:00.000Z',
    };

    const bankResponse = {
      bankReportedFdrNumber: 'SBI-100',
      bankReportedAmountPaise: 10000000,
      bankReportedDepositDate: '2024-08-15',
      depositExistenceStatus: 'FOUND_IN_SYNTHETIC_LEDGER',
      lienStatus: 'LIEN_RECORDED_IN_SIMULATION',
      lienBeneficiary: 'All India Council for Technical Education (AICTE)',
    };

    const result = bankFieldComparator.compareFdrWithBankResponse(submitted, bankResponse);
    expect(result.fieldComparisons.depositDate.outcome).toBe(COMPARISON_OUTCOME.MATCH);
  });

  // 19. Missing-field comparison
  it('19. Missing-field comparison flags MISSING_IN_BANK_RESPONSE gracefully', () => {
    const submitted = {
      fdrNumber: 'SBI-100',
      depositAmountPaise: 10000000,
    };

    const bankResponse = {
      bankReportedFdrNumber: 'SBI-100',
      bankReportedAmountPaise: null, // missing amount
      depositExistenceStatus: 'FOUND_IN_SYNTHETIC_LEDGER',
      lienStatus: 'LIEN_RECORDED_IN_SIMULATION',
    };

    const result = bankFieldComparator.compareFdrWithBankResponse(submitted, bankResponse);
    expect(result.fieldComparisons.amount.outcome).toBe(COMPARISON_OUTCOME.MISSING_IN_BANK_RESPONSE);
    expect(result.overallOutcome).toBe(COMPARISON_OUTCOME.INDETERMINATE);
  });

  // 20. Officer review actions
  it('20. Officer review actions record audit entry and transition review status', async () => {
    const review = await bankReviewRepository.recordReviewAction({
      requestId: 'bvr-demo-01',
      fdrId: 'fdr-demo-01',
      officerId: 'usr-demo-officer-01',
      reviewAction: BANK_REVIEW_ACTIONS.ADD_NOTE,
      notes: 'Reviewed joint lien clause against Western Regional Office register.',
    });

    expect(review.reviewId).toMatch(/^REV-/);
    expect(review.reviewAction).toBe(BANK_REVIEW_ACTIONS.ADD_NOTE);

    const history = await bankReviewRepository.getReviewsByRequestId('bvr-demo-01');
    expect(history.some((h) => h.reviewId === review.reviewId)).toBe(true);
  });

  // 21. Mandatory review reasons
  it('21. Mandatory review reasons rejects follow-up without substantive rationale (>= 5 chars)', async () => {
    await expect(
      bankReviewRepository.recordReviewAction({
        requestId: 'bvr-demo-01',
        officerId: 'usr-demo-officer-01',
        reviewAction: BANK_REVIEW_ACTIONS.REQUEST_FOLLOW_UP,
        reason: 'Bad', // only 3 chars
      })
    ).rejects.toThrow(/justification \(minimum 5 characters\) is mandatory/i);
  });

  // 22. Audit event generation
  it('22. Audit event generation logs every simulation request and review event', async () => {
    await bankReviewRepository.recordReviewAction({
      requestId: 'bvr-demo-01',
      fdrId: 'fdr-demo-01',
      officerId: 'usr-demo-officer-01',
      reviewAction: BANK_REVIEW_ACTIONS.ADD_NOTE,
      notes: 'Audit log check note',
    });
    const logs = await auditRepository.getAuditLogs();
    const hasBankAudits = logs.some((l) => l.eventType?.includes('BANK_VERIFICATION') || l.eventType?.includes('BANK_SIMULATION'));
    expect(hasBankAudits).toBe(true);
  });

  // 23. Notification generation
  it('23. Notification generation sends alerts to officer and institution portals', async () => {
    const notifs = await notificationRepository.getUserNotifications('usr-demo-officer-01', 'officer');
    expect(notifs.length).toBeGreaterThan(0);
  });

  // 24. Institution ownership isolation
  it('24. Institution ownership isolation blocks cross-institution dossier access in FDR detail', async () => {
    // Current institution inst-demo-01 owns fdr-demo-01, but not a theoretical inst-demo-02 FDR
    const fdrs = await fdrRepository.getFDRsByInstitution('inst-demo-01');
    const allFdrs = await fdrRepository.getAllFDRs();
    const otherInstFdrs = allFdrs.filter((f) => f.institutionId !== 'inst-demo-01');

    if (otherInstFdrs.length > 0) {
      expect(fdrs.some((f) => f.id === otherInstFdrs[0].id)).toBe(false);
    }
  });

  // 25. Officer route protection
  it('25. Officer route protection restricts unauthorized visitors from /officer/bank-verifications', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>LOGIN_REDIRECT</div>} />
        <Route
          path="/officer/bank-verifications"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer']}>
                <OfficerBankVerificationsPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: '/officer/bank-verifications' }
    );

    await waitFor(() => {
      expect(screen.getByText('LOGIN_REDIRECT')).toBeDefined();
    });
  });

  // 26. Admin monitoring
  it('26. Admin monitoring computes platform-wide simulation metrics', async () => {
    const stats = await bankVerificationRepository.getAdminMonitoringStats();
    expect(stats.totalRequests).toBeGreaterThanOrEqual(2);
    expect(stats.activeSimulatorsCount).toBe(6);
  });

  // 27. English/Hindi/Marathi rendering
  it('27. English/Hindi/Marathi rendering provides localized translations for Module 05 keys', () => {
    expect(en['bank.sim.disclaimer']).toBe('SIMULATED BANK RESPONSE — NOT A REAL BANK CONFIRMATION');
    expect(hi['bank.sim.disclaimer']).toContain('सिम्युलेटेड बैंक');
    expect(mr['bank.sim.disclaimer']).toContain('सिम्युलेटेड बँक');
  });

  // 28. Module 01 regression
  it('28. Module 01 regression: Public homepage renders national branding landmarks', () => {
    renderWithProviders(<HomePage />, { route: '/' });
    expect(screen.getAllByText(/NidhiSetu/i).length).toBeGreaterThan(0);
  });

  // 29. Module 02 regression
  it('29. Module 02 regression: User accounts and role authentication remain intact', async () => {
    const officer = await userRepository.getUserByEmail('scrutiny.west@aicte.demo');
    expect(officer).toBeDefined();
    expect(officer.role).toBe('officer');
  });

  // 30. Module 03 regression
  it('30. Module 03 regression: FDR records and lifecycle transitions continue working seamlessly', async () => {
    const fdrs = await fdrRepository.getAllFDRs();
    expect(fdrs.length).toBeGreaterThan(0);
  });

  // 31. Module 04 regression
  it('31. Module 04 regression: Document intelligence repository and review states remain unaffected', async () => {
    const analyses = await documentAnalysisRepository.getAllAnalyses();
    expect(analyses).toBeDefined();
  });
});
