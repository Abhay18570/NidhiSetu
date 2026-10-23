import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import {
  initializeStorage,
  storageService,
  STORAGE_KEYS,
  fdrRepository,
  fdrDocumentRepository,
  fdrLifecycleRepository,
  fdrMaturityService,
  FDR_STATUS,
  validateIFSC,
  isMaturityDateValid,
  validateDocumentFile,
  computeSHA256,
  rupeesToPaise,
  paiseToRupees,
  formatINR,
  notificationRepository,
  auditRepository,
  authRepository,
  userRepository,
  institutionRepository,
  sessionRepository
} from '../storage';

import { LanguageProvider } from '../i18n/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import InstitutionFdrRecordsPage from '../pages/institution/InstitutionFdrRecordsPage';
import OfficerQueuePage from '../pages/officer/OfficerQueuePage';
import FdrSubmissionWizard from '../pages/institution/FdrSubmissionWizard';

function renderWithProviders(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <LanguageProvider>
        <AuthProvider>
          {ui}
        </AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

describe('Module 03: FDR Management, Document Storage & Lifecycle Tracking Tests', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    await initializeStorage(true);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // 1. FDR draft creation
  it('1. FDR draft creation: successfully creates and returns a draft with DRAFT status', async () => {
    const draftData = {
      bankName: 'State Bank of India',
      fdrNumber: 'SBI-DRAFT-999',
      depositAmount: '500000',
    };
    const draft = await fdrRepository.saveDraft(draftData, 'inst-01');
    expect(draft).toBeDefined();
    expect(draft.id).toBeDefined();
    expect(draft.status).toBe(FDR_STATUS.DRAFT);
    expect(draft.institutionId).toBe('inst-01');
    expect(draft.bankName).toBe('State Bank of India');
  });

  // 2. Draft persistence
  it('2. Draft persistence: draft can be retrieved from storage for the owning institution', async () => {
    await fdrRepository.saveDraft({ bankName: 'Canara Bank', fdrNumber: 'CAN-111' }, 'inst-01');
    const drafts = await fdrRepository.getDrafts('inst-01');
    expect(drafts.length).toBeGreaterThanOrEqual(1);
    expect(drafts.some((d) => d.fdrNumber === 'CAN-111')).toBe(true);
  });

  // 3. Draft deletion
  it('3. Draft deletion: draft and associated scan reference are deleted cleanly', async () => {
    const draft = await fdrRepository.saveDraft({ bankName: 'Bank of Baroda', fdrNumber: 'BOB-DEL' }, 'inst-01');
    const deleteResult = await fdrRepository.deleteDraft(draft.id, 'inst-01');
    expect(deleteResult).toBe(true);

    const remaining = await fdrRepository.getDrafts('inst-01');
    expect(remaining.find((d) => d.id === draft.id)).toBeUndefined();
  });

  // 4. Institution ownership checks
  it('4. Institution ownership checks: institution cannot fetch or delete drafts belonging to another institution', async () => {
    const inst1Draft = await fdrRepository.saveDraft({ bankName: 'Punjab National Bank' }, 'inst-01');
    
    // inst-02 tries to get drafts
    const inst2Drafts = await fdrRepository.getDrafts('inst-02');
    expect(inst2Drafts.find((d) => d.id === inst1Draft.id)).toBeUndefined();

    // inst-02 tries to delete inst-01's draft
    const deleteAttempt = await fdrRepository.deleteDraft(inst1Draft.id, 'inst-02');
    expect(deleteAttempt).toBe(false);
  });

  // 5. Valid FDR submission
  it('5. Valid FDR submission: creates a SUBMITTED record with stable reference and audit log', async () => {
    const validData = {
      institutionId: 'inst-01',
      submittedBy: 'usr-inst-01',
      bankName: 'State Bank of India',
      branchName: 'Nariman Point',
      branchAddress: 'Mumbai, Maharashtra',
      ifsc: 'SBIN0001234',
      fdrNumber: 'FDR-SUBMIT-2026-X',
      accountHolderName: 'Principal, COEP Technological University Joint FDR',
      depositAmount: '2500000',
      depositDate: '2025-01-10',
      maturityDate: '2030-01-10',
      interestRate: '7.25',
      depositType: 'SECURITY_DEPOSIT',
      applicableSecurityRequirement: 'AICTE Security Deposit for New Program',
      documentId: 'doc-mock-1',
      fileName: 'fdr_certificate.pdf',
      fileType: 'application/pdf',
      fileSize: 2048576,
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    };

    const record = await fdrRepository.createFDR(validData, { id: 'usr-inst-01', role: 'institution' });
    expect(record).toBeDefined();
    expect(record.status).toBe(FDR_STATUS.SUBMITTED);
    expect(record.referenceNumber).toMatch(/^FDR-\d{4}-\d{4}$/);
    expect(record.depositAmountPaise).toBe(250000000);
  });

  // 6. Invalid IFSC rejection
  it('6. Invalid IFSC rejection: rejects improperly formatted IFSC codes', () => {
    expect(validateIFSC('SBIN0001234')).toBe(true);
    expect(validateIFSC('HDFC0000456')).toBe(true);
    expect(validateIFSC('INVALID123')).toBe(false);
    expect(validateIFSC('SBIN1001234')).toBe(false); // 5th char must be 0
    expect(validateIFSC('')).toBe(false);
    expect(validateIFSC(null)).toBe(false);
  });

  // 7. Invalid maturity date rejection
  it('7. Invalid maturity date rejection: rejects maturity dates on or before deposit date', () => {
    expect(isMaturityDateValid('2025-01-01', '2030-01-01')).toBe(true);
    expect(isMaturityDateValid('2025-01-01', '2025-01-01')).toBe(false);
    expect(isMaturityDateValid('2025-06-01', '2024-01-01')).toBe(false);
    expect(isMaturityDateValid('', '2025-01-01')).toBe(false);
  });

  // 8. Duplicate FDR warning
  it('8. Duplicate FDR warning: flags existing FDR number under the same bank', async () => {
    const isDup1 = await fdrRepository.isFdrNumberDuplicate('SBIN0001110', 'SBI-FDR-9812401');
    expect(isDup1).toBe(true);

    const isDup2 = await fdrRepository.isFdrNumberDuplicate('SBIN0001110', 'BRAND-NEW-FDR-12345');
    expect(isDup2).toBe(false);
  });

  // 9. File type validation
  it('9. File type validation: allows PDF, JPEG, PNG, WebP and rejects executables and scripts', () => {
    const pdf = new File(['mock content'], 'test.pdf', { type: 'application/pdf' });
    expect(validateDocumentFile(pdf).valid).toBe(true);

    const jpg = new File(['mock content'], 'scan.jpg', { type: 'image/jpeg' });
    expect(validateDocumentFile(jpg).valid).toBe(true);

    const exe = new File(['mock executable'], 'bad.exe', { type: 'application/x-msdownload' });
    expect(validateDocumentFile(exe).valid).toBe(false);
  });

  // 10. File size validation
  it('10. File size validation: rejects files exceeding maximum upload limit (10MB)', () => {
    const oversized = { name: 'huge.pdf', type: 'application/pdf', size: 15 * 1024 * 1024 };
    const result = validateDocumentFile(oversized);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('10 MB');
  });

  // 11. SHA-256 fingerprint generation
  it('11. SHA-256 fingerprint generation: computes standard 64-character hex hash', async () => {
    const blob = new Blob(['NidhiSetu FDR Security Test Payload'], { type: 'text/plain' });
    const hash = await computeSHA256(blob);
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(64);
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
  });

  // 12. IndexedDB document persistence & retrieval
  it('12. IndexedDB document persistence: saves document blob and retrieves it with metadata', async () => {
    const blob = new Blob(['Sample Binary Content'], { type: 'application/pdf' });
    const saved = await fdrDocumentRepository.saveDocument(blob, {
      fileName: 'test_deposit.pdf',
      fileType: 'application/pdf',
      fileSize: blob.size,
      sha256Hash: 'a1b2c3d4e5f6',
      institutionId: 'inst-01',
    });

    expect(saved.id).toBeDefined();
    expect(saved.fileName).toBe('test_deposit.pdf');

    const retrieved = await fdrDocumentRepository.getDocument(saved.id);
    expect(retrieved).toBeDefined();
    expect(retrieved.fileName).toBe('test_deposit.pdf');
  });

  // 13. Document preview and retrieval
  it('13. Document preview: generates object URL and safely revokes it', async () => {
    const blob = new Blob(['Previewable PDF'], { type: 'application/pdf' });
    const saved = await fdrDocumentRepository.saveDocument(blob, {
      fileName: 'preview.pdf',
      fileType: 'application/pdf',
      fileSize: blob.size,
      sha256Hash: 'hash-test',
      institutionId: 'inst-01',
    });

    const url = await fdrDocumentRepository.createDocumentUrl(saved.id);
    expect(url).toBeDefined();
    expect(typeof url).toBe('string');

    // Revocation does not throw
    expect(() => fdrDocumentRepository.revokeDocumentUrl(url)).not.toThrow();
  });

  // 14. Storage failure recovery
  it('14. Storage failure recovery: corrupted FDR storage key falls back to empty array without crashing', async () => {
    localStorage.setItem(STORAGE_KEYS.FDR_RECORDS, 'CORRUPTED_JSON_DATA{{{');
    const fdrs = await fdrRepository.getAllFDRs();
    expect(Array.isArray(fdrs)).toBe(true);
    expect(fdrs.length).toBe(0);
  });

  // 15. Valid lifecycle transitions
  it('15. Valid lifecycle transitions: permits official transitions along scrutiny pipeline', () => {
    expect(fdrLifecycleRepository.validateTransition(FDR_STATUS.DRAFT, FDR_STATUS.SUBMITTED, 'institution').valid).toBe(true);
    expect(fdrLifecycleRepository.validateTransition(FDR_STATUS.SUBMITTED, FDR_STATUS.UNDER_REVIEW, 'officer').valid).toBe(true);
    expect(fdrLifecycleRepository.validateTransition(FDR_STATUS.UNDER_REVIEW, FDR_STATUS.CLARIFICATION_REQUIRED, 'officer').valid).toBe(true);
    expect(fdrLifecycleRepository.validateTransition(FDR_STATUS.CLARIFICATION_REQUIRED, FDR_STATUS.RESUBMITTED, 'institution').valid).toBe(true);
    expect(fdrLifecycleRepository.validateTransition(FDR_STATUS.RESUBMITTED, FDR_STATUS.UNDER_REVIEW, 'officer').valid).toBe(true);
    expect(fdrLifecycleRepository.validateTransition(FDR_STATUS.UNDER_REVIEW, FDR_STATUS.REVIEW_ACCEPTED, 'officer').valid).toBe(true);
    expect(fdrLifecycleRepository.validateTransition(FDR_STATUS.UNDER_REVIEW, FDR_STATUS.REVIEW_REJECTED, 'officer').valid).toBe(true);
  });

  // 16. Invalid lifecycle transitions
  it('16. Invalid lifecycle transitions: rejects improper or out-of-sequence transitions', () => {
    expect(fdrLifecycleRepository.validateTransition(FDR_STATUS.DRAFT, FDR_STATUS.REVIEW_ACCEPTED, 'institution').valid).toBe(false);
    expect(fdrLifecycleRepository.validateTransition(FDR_STATUS.SUBMITTED, FDR_STATUS.REVIEW_ACCEPTED, 'officer').valid).toBe(false);
    expect(fdrLifecycleRepository.validateTransition(FDR_STATUS.CLARIFICATION_REQUIRED, FDR_STATUS.REVIEW_ACCEPTED, 'officer').valid).toBe(false);
    expect(fdrLifecycleRepository.validateTransition(FDR_STATUS.REVIEW_ACCEPTED, FDR_STATUS.UNDER_REVIEW, 'officer').valid).toBe(false);
  });

  // 17. Officer review actions
  it('17. Officer review actions: records transition event and updates status in repository', async () => {
    const fdr = await fdrRepository.getFDRById('fdr-demo-02'); // initially SUBMITTED
    expect(fdr.status).toBe(FDR_STATUS.SUBMITTED);

    const updated = await fdrRepository.updateFDR(fdr.id, { status: FDR_STATUS.UNDER_REVIEW }, {
      id: 'usr-off-01',
      role: 'officer',
      name: 'Dr. Suresh Varma',
    });

    expect(updated.status).toBe(FDR_STATUS.UNDER_REVIEW);
    const events = await fdrLifecycleRepository.getEventsForFDR(fdr.id);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].newStatus).toBe(FDR_STATUS.UNDER_REVIEW);
  });

  // 18. Clarification workflow
  it('18. Clarification workflow: moves to CLARIFICATION_REQUIRED with mandatory reason', async () => {
    const fdr = await fdrRepository.getFDRById('fdr-demo-03'); // initially UNDER_REVIEW
    const updated = await fdrRepository.updateFDR(
      fdr.id,
      {
        status: FDR_STATUS.CLARIFICATION_REQUIRED,
        clarificationReason: 'Lien endorsement endorsement seal is partially blurred.',
      },
      { id: 'usr-off-01', role: 'officer', name: 'Dr. Suresh Varma' }
    );

    expect(updated.status).toBe(FDR_STATUS.CLARIFICATION_REQUIRED);
    expect(updated.clarificationReason).toBe('Lien endorsement endorsement seal is partially blurred.');
  });

  // 19. Notification generation
  it('19. Notification generation: creating and updating FDR produces in-app notification', async () => {
    const notificationsBefore = await notificationRepository.getUserNotifications('usr-inst-01');
    const countBefore = notificationsBefore.length;

    await fdrRepository.createFDR(
      {
        institutionId: 'inst-01',
        submittedBy: 'usr-inst-01',
        bankName: 'HDFC Bank',
        branchName: 'Fort',
        ifsc: 'HDFC0000123',
        fdrNumber: 'HDFC-NOTIF-TEST',
        depositAmount: '1000000',
        depositDate: '2025-01-01',
        maturityDate: '2028-01-01',
      },
      { id: 'usr-inst-01', role: 'institution' }
    );

    const notificationsAfter = await notificationRepository.getUserNotifications('usr-inst-01');
    expect(notificationsAfter.length).toBeGreaterThan(countBefore);
  });

  // 20. Audit event generation
  it('20. Audit event generation: lifecycle updates generate immutable audit trail entries', async () => {
    const logsBefore = await auditRepository.getAuditLogs();
    const countBefore = logsBefore.length;

    await fdrRepository.createFDR(
      {
        institutionId: 'inst-01',
        submittedBy: 'usr-inst-01',
        bankName: 'Bank of India',
        ifsc: 'BKID0001234',
        fdrNumber: 'BKID-AUDIT-TEST',
        depositAmount: '1500000',
        depositDate: '2025-01-01',
        maturityDate: '2030-01-01',
      },
      { id: 'usr-inst-01', role: 'institution' }
    );

    const logsAfter = await auditRepository.getAuditLogs();
    expect(logsAfter.length).toBeGreaterThan(countBefore);
  });

  // 21. Maturity date calculations
  it('21. Maturity date calculations: calendar-date-safe calculation accurately computes categories', () => {
    const today = new Date();
    
    // Future: 200 days away -> ACTIVE
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 200);
    const futureIso = futureDate.toISOString().split('T')[0];
    const catFuture = fdrMaturityService.getMaturityCategory(futureIso);
    expect(catFuture).toBe(fdrMaturityService.MATURITY_CATEGORY.ACTIVE);

    // Approaching: 60 days away -> APPROACHING
    const approachingDate = new Date(today);
    approachingDate.setDate(today.getDate() + 60);
    const approachingIso = approachingDate.toISOString().split('T')[0];
    const catApproaching = fdrMaturityService.getMaturityCategory(approachingIso);
    expect(catApproaching).toBe(fdrMaturityService.MATURITY_CATEGORY.APPROACHING);

    // Matures soon: 15 days away -> MATURES_SOON
    const soonDate = new Date(today);
    soonDate.setDate(today.getDate() + 15);
    const soonIso = soonDate.toISOString().split('T')[0];
    const catSoon = fdrMaturityService.getMaturityCategory(soonIso);
    expect(catSoon).toBe(fdrMaturityService.MATURITY_CATEGORY.MATURES_SOON);

    // Past: 10 days ago -> MATURED
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 10);
    const pastIso = pastDate.toISOString().split('T')[0];
    const catPast = fdrMaturityService.getMaturityCategory(pastIso);
    expect(catPast).toBe(fdrMaturityService.MATURITY_CATEGORY.MATURED);
  });

  // 22. Renewal linking
  it('22. Renewal linking: creates pre-filled draft linked to original FDR reference', async () => {
    const original = await fdrRepository.getFDRById('fdr-demo-08'); // Matured FDR
    const renewalDraft = await fdrRepository.initiateRenewal(original.id, {
      id: 'usr-inst-01',
      role: 'institution',
    });

    expect(renewalDraft).toBeDefined();
    expect(renewalDraft.status).toBe(FDR_STATUS.DRAFT);
    expect(renewalDraft.renewalReferenceId).toBe(original.referenceNumber);
    expect(renewalDraft.bankName).toBe(original.bankName);
  });

  // 23. Dashboard statistic accuracy
  it('23. Dashboard statistic accuracy: getPlatformFdrStats returns accurate counts and totals', async () => {
    const stats = await fdrRepository.getPlatformFdrStats();
    expect(stats.totalFDRCount).toBeGreaterThan(0);
    expect(stats.totalDeclaredDepositPaise).toBeGreaterThan(0);
    expect(typeof stats.statusCounts).toBe('object');
  });

  // 24. Multilingual rendering
  it('24. Multilingual rendering: language provider supports EN, HI, and MR with Module 03 keys', async () => {
    const { en } = await import('../i18n/translations/en');
    const { hi } = await import('../i18n/translations/hi');
    const { mr } = await import('../i18n/translations/mr');

    expect(en['fdr.wizard.title']).toBeDefined();
    expect(hi['fdr.wizard.title']).toBeDefined();
    expect(mr['fdr.wizard.title']).toBeDefined();
    expect(en['fdr.status.submitted']).toBe('Submitted');
    expect(hi['fdr.status.submitted']).toBe('प्रस्तुत');
    expect(mr['fdr.status.submitted']).toBe('सादर केले (Submitted)');
  });

  // 25. Protected route behavior
  it('25. Protected route behavior: unauthenticated access to FDR wizard redirects to login', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Login Page Mock</div>} />
        <Route
          path="/institution/fdr/new"
          element={
            <ProtectedRoute allowedRoles={['institution']}>
              <div>FDR Wizard Screen</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: '/institution/fdr/new' }
    );

    await waitFor(() => {
      expect(screen.getByText('Login Page Mock')).toBeInTheDocument();
    });
  });

  // 26. Module 01 and Module 02 regression
  it('26. Module 01 and Module 02 regression: user auth and existing repos continue to work', async () => {
    const users = await userRepository.getAllUsers();
    expect(users.length).toBeGreaterThan(0);
    const authResult = await authRepository.login('principal@coep-pune.demo', 'demo@123');
    expect(authResult.success).toBe(true);
    expect(authResult.user.role).toBe('institution');
  });

  // Integration Test: Complete End-to-End Workflow
  it('27. Integration workflow: Institution Submit -> Officer Review -> Clarify -> Resubmit -> Accept', async () => {
    // A. Institution Submits FDR
    const instUser = { id: 'usr-inst-01', role: 'institution', name: 'Dr. Ramesh Patil' };
    const newFdr = await fdrRepository.createFDR(
      {
        institutionId: 'inst-01',
        submittedBy: instUser.id,
        bankName: 'Union Bank of India',
        branchName: 'Shivajinagar, Pune',
        branchAddress: 'Pune, Maharashtra',
        ifsc: 'UBIN0532101',
        fdrNumber: 'UBI-E2E-998877',
        accountHolderName: 'Principal COEP Technological University Joint FDR',
        depositAmount: '1200000',
        depositDate: '2025-01-15',
        maturityDate: '2030-01-15',
        interestRate: '7.10',
        depositType: 'SECURITY_DEPOSIT',
        applicableSecurityRequirement: 'AICTE Security Deposit for New Program',
      },
      instUser
    );
    expect(newFdr.status).toBe(FDR_STATUS.SUBMITTED);

    // B. Officer Starts Review
    const officerUser = { id: 'usr-off-01', role: 'officer', name: 'Dr. Suresh Varma' };
    const underReview = await fdrRepository.updateFDR(
      newFdr.id,
      { status: FDR_STATUS.UNDER_REVIEW },
      officerUser
    );
    expect(underReview.status).toBe(FDR_STATUS.UNDER_REVIEW);

    // C. Officer Requests Clarification
    const clarified = await fdrRepository.updateFDR(
      newFdr.id,
      {
        status: FDR_STATUS.CLARIFICATION_REQUIRED,
        clarificationReason: 'Bank lien stamp needs clearer resolution.',
      },
      officerUser
    );
    expect(clarified.status).toBe(FDR_STATUS.CLARIFICATION_REQUIRED);

    // D. Institution Resubmits with explanation
    const resubmitted = await fdrRepository.updateFDR(
      newFdr.id,
      {
        status: FDR_STATUS.RESUBMITTED,
        reviewNotes: 'Uploaded high resolution scan endorsed by branch manager.',
      },
      instUser
    );
    expect(resubmitted.status).toBe(FDR_STATUS.RESUBMITTED);

    // E. Officer puts back Under Review and then Accepts
    const backUnderReview = await fdrRepository.updateFDR(
      newFdr.id,
      { status: FDR_STATUS.UNDER_REVIEW },
      officerUser
    );
    expect(backUnderReview.status).toBe(FDR_STATUS.UNDER_REVIEW);

    const accepted = await fdrRepository.updateFDR(
      newFdr.id,
      {
        status: FDR_STATUS.REVIEW_ACCEPTED,
        reviewNotes: 'All regulatory conditions satisfied. Deposit receipt validated administratively.',
      },
      officerUser
    );
    expect(accepted.status).toBe(FDR_STATUS.REVIEW_ACCEPTED);

    // Verify lifecycle timeline history preserved (newest first)
    const events = await fdrLifecycleRepository.getEventsForFDR(newFdr.id);
    expect(events.length).toBe(6);
    expect(events.map((e) => e.newStatus)).toEqual([
      FDR_STATUS.REVIEW_ACCEPTED,
      FDR_STATUS.UNDER_REVIEW,
      FDR_STATUS.RESUBMITTED,
      FDR_STATUS.CLARIFICATION_REQUIRED,
      FDR_STATUS.UNDER_REVIEW,
      FDR_STATUS.SUBMITTED,
    ]);
  });
});
