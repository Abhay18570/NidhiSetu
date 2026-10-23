/**
 * NidhiSetu — Module 07 Automated Test Suite
 * Comprehensive automated verification for Smart FDR Renewal, Deposit Continuity,
 * Calendar-Safe Maturity Planning, Gap Detection, Simulated Lien Tracking,
 * Administrative Release Management, Escalation Triggers, and Cross-Module Regressions.
 */

import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import {
  initializeStorage,
  storageService,
  STORAGE_KEYS,
  fdrRepository,
  auditRepository,
  notificationRepository,
  userRepository,
  institutionRepository,
  complianceRuleRepository,
  complianceAssessmentRepository,
  complianceCaseRepository,
  documentAnalysisRepository,
  bankVerificationRepository,
  renewalPlanRepository,
  renewalRequestRepository,
  renewalReviewRepository,
  releaseRequestRepository,
  renewalEscalationRepository,
} from '../storage';

import {
  RENEWAL_TYPES,
  RENEWAL_STATUS,
  RELEASE_STATUS,
  CONTINUITY_STATUS,
  ESCALATION_LEVELS,
  ADMIN_RELEASE_DISCLAIMER,
  RENEWAL_PROTOTYPE_DISCLAIMER,
  validateRenewalRequest,
} from '../renewal/renewalModel';

import {
  buildRenewalPlan,
  generateRenewalPlans,
  getPlanningWindow,
  getRenewalPriority,
  PLANNING_WINDOW,
  RENEWAL_PRIORITY,
} from '../renewal/renewalPlanner';

import {
  evaluateRenewalEligibility,
  validateReplacementFdrs,
  ELIGIBILITY_OUTCOMES,
} from '../renewal/renewalEligibilityEngine';

import {
  calculateDepositContinuity,
  toPaise,
} from '../renewal/renewalContinuityEngine';

import {
  detectCoverageGaps,
  GAP_TYPES,
  GAP_SEVERITY,
} from '../renewal/renewalGapDetector';

import {
  validateRenewalTransition,
  validateReleaseTransition,
} from '../renewal/renewalWorkflowEngine';

import {
  evaluateSimulatedLienContinuity,
  SIMULATED_LIEN_STATUS,
} from '../renewal/renewalLienAdapter';

import {
  evaluateReleaseEligibility,
  RELEASE_ELIGIBILITY_OUTCOMES,
} from '../renewal/releaseEligibilityEngine';

import {
  evaluateRenewalEscalations,
} from '../renewal/escalationEngine';

import {
  renewalReportBuilder,
} from '../renewal/renewalReportBuilder';

import { getDaysUntilMaturity, normalizeToCalendarDate } from '../storage/fdrMaturityService';

import { LanguageProvider } from '../i18n/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import RoleGuard from '../components/auth/RoleGuard';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import HomePage from '../pages/HomePage';
import { authRepository } from '../storage/authRepository';
import { en } from '../i18n/translations/en';
import { hi } from '../i18n/translations/hi';
import { mr } from '../i18n/translations/mr';

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


describe('Module 07: Smart FDR Renewal, Deposit Continuity & Simulated Lien Release Management', () => {
  beforeEach(() => {
    initializeStorage(true);
  });

  // 1. Renewal plan generation
  it('1. Generates structured renewal plans for FDR records', () => {
    const fdr = {
      id: 'fdr-test-01',
      fdrNumber: 'FDR-SBI-2023-1111',
      institutionId: 'inst-001',
      institutionName: 'Sardar Patel Institute of Technology',
      maturityDate: '2026-04-15',
      depositAmountPaise: 350000000,
    };

    const plan = buildRenewalPlan(fdr, [], new Date('2026-03-01'));
    expect(plan).toBeDefined();
    expect(plan.fdrId).toBe('fdr-test-01');
    expect(plan.daysUntilMaturity).toBeGreaterThan(0);
    expect(plan.planningWindow).toBe(PLANNING_WINDOW.APPROACHING_60);
    expect(plan.planningDeadline).toBe('2026-03-16');
  });

  // 2. Calendar-safe maturity calculations
  it('2. Calendar-safe maturity calculations eliminate timezone off-by-one errors', () => {
    const d1 = '2026-04-15';
    const ref = '2026-04-10';
    const days = getDaysUntilMaturity(d1, ref);
    expect(days).toBe(5);

    const maturedDays = getDaysUntilMaturity('2026-03-01', new Date('2026-03-15'));
    expect(maturedDays).toBe(-14);
  });


  // 3. Renewal eligibility
  it('3. Renewal eligibility confirms valid lifecycle states and ownership', () => {
    const validFdr = {
      id: 'fdr-elig-1',
      fdrNumber: 'FDR-SBI-2023-01',
      institutionId: 'inst-001',
      status: 'APPROVED',
      maturityDate: '2026-05-01',
    };

    const res = evaluateRenewalEligibility(validFdr, 'inst-001', []);
    expect(res.eligible).toBe(true);
    expect(res.outcome).toBe(ELIGIBILITY_OUTCOMES.ELIGIBLE);
  });

  // 4. Early renewal support
  it('4. Early renewal (>90 days away) is explicitly supported without artificial blocks', () => {
    const earlyFdr = {
      id: 'fdr-early-1',
      fdrNumber: 'FDR-PNB-2024-02',
      institutionId: 'inst-001',
      status: 'APPROVED',
      maturityDate: '2028-12-31', // ~2+ years away
    };

    const res = evaluateRenewalEligibility(earlyFdr, 'inst-001', []);
    expect(res.eligible).toBe(true);
    expect(res.outcome).toBe(ELIGIBILITY_OUTCOMES.ELIGIBLE);
  });

  // 5. Duplicate renewal prevention
  it('5. Prevents duplicate active renewal cycles for the same source FDR', () => {
    const fdr = {
      id: 'fdr-dup-1',
      fdrNumber: 'FDR-SBI-2023-03',
      institutionId: 'inst-001',
      status: 'APPROVED',
    };

    const existingReqs = [
      {
        renewalRequestId: 'RNL-ACTIVE-01',
        originalFdrId: 'fdr-dup-1',
        status: RENEWAL_STATUS.UNDER_REVIEW,
      },
    ];

    const res = evaluateRenewalEligibility(fdr, 'inst-001', existingReqs);
    expect(res.eligible).toBe(false);
    expect(res.outcome).toBe(ELIGIBILITY_OUTCOMES.ALREADY_IN_RENEWAL);
  });

  // 6. Invalid renewal chain detection
  it('6. Detects invalid renewal chain when FDR is configured as its own replacement', () => {
    const originalFdr = { id: 'fdr-self-1', fdrNumber: 'FDR-SBI-1', institutionId: 'inst-001' };
    const replacementFdrs = [{ id: 'fdr-self-1', fdrNumber: 'FDR-SBI-1', institutionId: 'inst-001' }];

    const check = validateReplacementFdrs(originalFdr, replacementFdrs);
    expect(check.valid).toBe(false);
    expect(check.errors[0]).toContain('cannot be configured as its own replacement');
  });

  // 7. Cross-institution replacement rejection
  it('7. Rejects cross-institution replacement FDR linkages', () => {
    const originalFdr = { id: 'fdr-inst-1', institutionId: 'inst-001', fdrNumber: 'FDR-1' };
    const replacementFdrs = [{ id: 'fdr-inst-2', institutionId: 'inst-002', fdrNumber: 'FDR-2' }];

    const check = validateReplacementFdrs(originalFdr, replacementFdrs);
    expect(check.valid).toBe(false);
    expect(check.errors[0]).toContain('Cross-institution mismatch');
  });

  // 8. Draft persistence
  it('8. Supports saving and updating renewal request drafts', async () => {
    const draft = await renewalRequestRepository.createRequest(
      {
        institutionId: 'inst-001',
        originalFdrId: 'fdr-draft-1',
        originalFdrNumber: 'FDR-SBI-DRAFT',
        renewalType: RENEWAL_TYPES.REPLACEMENT_FDR,
        replacementFdrIds: ['fdr-rep-1'],
        originalAmountPaise: 250000000,
      },
      true
    );

    expect(draft.status).toBe(RENEWAL_STATUS.DRAFT);
    expect(draft.submittedAt).toBeNull();

    const updated = await renewalRequestRepository.updateDraft(draft.renewalRequestId, {
      proposedMaturityDate: '2031-05-15',
    });
    expect(updated.proposedMaturityDate).toBe('2031-05-15');
  });

  // 9. Renewal submission
  it('9. Submitting a renewal request transitions status to SUBMITTED with audit logging', async () => {
    const submitted = await renewalRequestRepository.createRequest(
      {
        institutionId: 'inst-001',
        originalFdrId: 'fdr-sub-1',
        originalFdrNumber: 'FDR-SBI-SUB',
        renewalType: RENEWAL_TYPES.REPLACEMENT_FDR,
        replacementFdrIds: ['fdr-rep-2'],
        originalAmountPaise: 300000000,
        replacementTotalPaise: 300000000,
      },
      false
    );

    expect(submitted.status).toBe(RENEWAL_STATUS.SUBMITTED);
    expect(submitted.renewalReference).toMatch(/^RNL-\d{4}-\d{6}$/);

    const logs = await auditRepository.getAuditLogs();
    const subLog = logs.find((l) => l.targetEntityId === submitted.renewalRequestId);
    expect(subLog).toBeDefined();
    expect(subLog.eventType).toBe('RENEWAL_REQUEST_SUBMITTED');
  });


  // 10. Renewal lifecycle transitions
  it('10. Enforces deterministic renewal request state transitions', async () => {
    const req = await renewalRequestRepository.createRequest(
      {
        institutionId: 'inst-001',
        originalFdrId: 'fdr-life-1',
        originalFdrNumber: 'FDR-LIFE',
        renewalType: RENEWAL_TYPES.REPLACEMENT_FDR,
        replacementFdrIds: ['fdr-rep-3'],
        originalAmountPaise: 100000000,
        replacementTotalPaise: 100000000,
      },
      false
    );

    // SUBMITTED -> UNDER_REVIEW
    const underReview = await renewalRequestRepository.transitionStatus(
      req.renewalRequestId,
      RENEWAL_STATUS.UNDER_REVIEW,
      { actorId: 'officer-1', actorRole: 'officer', reason: 'Review started' }
    );
    expect(underReview.status).toBe(RENEWAL_STATUS.UNDER_REVIEW);

    // Invalid transition directly to RESUBMITTED without clarification
    await expect(
      renewalRequestRepository.transitionStatus(req.renewalRequestId, RENEWAL_STATUS.RESUBMITTED, {
        actorId: 'officer-1',
        actorRole: 'officer',
      })
    ).rejects.toThrow(/Invalid lifecycle transition/);
  });

  // 11. Mandatory officer reasons
  it('11. Requires mandatory substantive justification for clarification and rejection', () => {
    const rejectCheck = validateRenewalTransition(
      RENEWAL_STATUS.UNDER_REVIEW,
      RENEWAL_STATUS.REJECTED,
      'officer',
      'No' // too short
    );
    expect(rejectCheck.valid).toBe(false);
    expect(rejectCheck.error).toContain('Mandatory substantive justification');

    const validCheck = validateRenewalTransition(
      RENEWAL_STATUS.UNDER_REVIEW,
      RENEWAL_STATUS.REJECTED,
      'officer',
      'Certificate details do not reconcile with issuing branch advice.'
    );
    expect(validCheck.valid).toBe(true);
  });

  // 12. One-to-one replacement
  it('12. Evaluates 1:1 replacement with identical coverage as continuous', () => {
    const orig = {
      id: 'orig-1',
      fdrNumber: 'FDR-ORIG-1',
      depositAmountPaise: 350000000,
      maturityDate: '2026-04-15',
    };
    const rep = {
      id: 'rep-1',
      fdrNumber: 'FDR-REP-1',
      depositAmountPaise: 350000000,
      effectiveDate: '2026-04-10',
      maturityDate: '2031-04-10',
    };

    const res = calculateDepositContinuity({
      originalFdr: orig,
      replacementFdrs: [rep],
      renewalType: RENEWAL_TYPES.REPLACEMENT_FDR,
    });

    expect(res.continuityStatus).toBe(CONTINUITY_STATUS.CONTINUOUS_DECLARED_COVERAGE);
    expect(res.maxShortfallPaise).toBe(0);
    expect(res.uncoveredIntervals).toHaveLength(0);
  });

  // 13. One-to-many replacement
  it('13. Evaluates 1:Many replacement aggregating multiple certificates', () => {
    const orig = {
      id: 'orig-multi',
      depositAmountPaise: 500000000, // ₹50 Lakhs
      maturityDate: '2026-06-30',
    };
    const rep1 = {
      id: 'rep-m1',
      depositAmountPaise: 300000000, // ₹30 Lakhs
      effectiveDate: '2026-06-25',
      maturityDate: '2031-06-25',
    };
    const rep2 = {
      id: 'rep-m2',
      depositAmountPaise: 200000000, // ₹20 Lakhs
      effectiveDate: '2026-06-25',
      maturityDate: '2031-06-25',
    };

    const res = calculateDepositContinuity({
      originalFdr: orig,
      replacementFdrs: [rep1, rep2],
      renewalType: RENEWAL_TYPES.MULTIPLE_REPLACEMENT_FDRS,
    });

    expect(res.continuityStatus).toBe(CONTINUITY_STATUS.CONTINUOUS_DECLARED_COVERAGE);
    expect(res.replacementTotalPaise).toBe(500000000);
  });

  // 14. Partial replacement
  it('14. Identifies shortfall in partial replacements with exact integer paise deficit', () => {
    const orig = {
      id: 'orig-part',
      depositAmountPaise: 350000000, // ₹35 Lakhs
      maturityDate: '2026-04-15',
    };
    const rep = {
      id: 'rep-part',
      depositAmountPaise: 250000000, // ₹25 Lakhs
      effectiveDate: '2026-04-10',
      maturityDate: '2031-04-10',
    };

    const res = calculateDepositContinuity({
      originalFdr: orig,
      replacementFdrs: [rep],
      renewalType: RENEWAL_TYPES.PARTIAL_REPLACEMENT,
    });

    expect(res.continuityStatus).toBe(CONTINUITY_STATUS.PARTIAL_DECLARED_COVERAGE);
    expect(res.maxShortfallPaise).toBe(100000000); // Exactly ₹10 Lakhs shortfall
  });

  // 15. Integer-paise continuity calculation
  it('15. Integer-paise arithmetic prevents floating-point inaccuracies', () => {
    const p1 = toPaise(1000.55 * 100);
    const p2 = toPaise('₹25,00,000.00');
    expect(p1).toBe(100055);
    expect(p2).toBe(250000000);
    expect(Number.isSafeInteger(p1)).toBe(true);
    expect(Number.isSafeInteger(p2)).toBe(true);
  });

  // 16. Overlap handling
  it('16. Handles transition overlap without falsely double-counting security amount', () => {
    const orig = {
      id: 'orig-overlap',
      depositAmountPaise: 200000000,
      maturityDate: '2026-04-15',
    };
    const rep = {
      id: 'rep-overlap',
      depositAmountPaise: 200000000,
      effectiveDate: '2026-03-15', // 1 month overlap
      maturityDate: '2031-03-15',
    };

    const res = calculateDepositContinuity({
      originalFdr: orig,
      replacementFdrs: [rep],
    });

    // Coverage during transition is replacement total (₹20 Lakhs), not ₹40 Lakhs!
    expect(res.coverageDuringTransition).toBe(200000000);
    expect(res.continuityStatus).toBe(CONTINUITY_STATUS.CONTINUOUS_DECLARED_COVERAGE);
  });

  // 17. Gap interval detection
  it('17. Detects temporal gap when replacement starts after original maturity', () => {
    const orig = {
      id: 'orig-gap',
      fdrNumber: 'FDR-GAP-1',
      depositAmountPaise: 200000000,
      maturityDate: '2026-04-15',
    };
    const rep = {
      id: 'rep-gap',
      fdrNumber: 'FDR-REP-GAP',
      depositAmountPaise: 200000000,
      effectiveDate: '2026-05-01', // Starts 16 days after original maturity
      maturityDate: '2031-05-01',
    };

    const gaps = detectCoverageGaps({ originalFdr: orig, replacementFdrs: [rep] });
    expect(gaps.some((g) => g.gapType === GAP_TYPES.TEMPORAL_START_GAP)).toBe(true);
    const timeGap = gaps.find((g) => g.gapType === GAP_TYPES.TEMPORAL_START_GAP);
    expect(timeGap.gapStartDate).toBe('2026-04-15');
    expect(timeGap.gapEndDate).toBe('2026-05-01');
  });

  // 18. Shortfall calculation
  it('18. Calculates financial gap when replacement is below configured required amount', () => {
    const orig = {
      id: 'orig-short',
      fdrNumber: 'FDR-SHORT-1',
      depositAmountPaise: 350000000,
      maturityDate: '2026-04-15',
    };
    const rep = {
      id: 'rep-short',
      depositAmountPaise: 200000000,
      effectiveDate: '2026-04-10',
      maturityDate: '2031-04-10',
    };

    const gaps = detectCoverageGaps({
      originalFdr: orig,
      replacementFdrs: [rep],
    });

    const amtGap = gaps.find((g) => g.gapType === GAP_TYPES.AMOUNT_SHORTFALL);
    expect(amtGap).toBeDefined();
    expect(amtGap.maxShortfallPaise).toBe(150000000);
  });

  // 19. Missing rule handling
  it('19. Fallback cleanly to original FDR principal when regulatory rule is not configured', () => {
    const orig = {
      id: 'orig-norule',
      depositAmountPaise: 200000000,
      maturityDate: '2026-05-01',
    };
    const rep = {
      id: 'rep-norule',
      depositAmountPaise: 200000000,
      effectiveDate: '2026-04-20',
      maturityDate: '2031-04-20',
    };

    const res = calculateDepositContinuity({
      originalFdr: orig,
      replacementFdrs: [rep],
      applicableRule: null,
    });

    expect(res.requiredDepositPaise).toBe(200000000);
    expect(res.continuityStatus).toBe(CONTINUITY_STATUS.CONTINUOUS_DECLARED_COVERAGE);
  });

  // 20. Stale evidence handling
  it('20. Evaluates missing replacement deposit as indeterminate or gap without crash', () => {
    const res = calculateDepositContinuity({
      originalFdr: null,
      replacementFdrs: [],
    });
    expect(res.continuityStatus).toBe(CONTINUITY_STATUS.INDETERMINATE);
  });

  // 21. Simulated lien labeling
  it('21. Simulated lien adapter prominently identifies simulation source and disclaimers', async () => {
    const lien = await evaluateSimulatedLienContinuity({
      originalFdrId: 'fdr-demo-01',
      replacementFdrIds: ['fdr-demo-03'],
    });

    expect(lien.isSimulated).toBe(true);
    expect(lien.disclaimer).toContain('No actual bank lien operations performed');
    expect(Object.values(SIMULATED_LIEN_STATUS)).toContain(lien.status);
  });

  // 22. Release eligibility
  it('22. Release eligibility flags open compliance cases as blocking administrative review', async () => {
    // Create an open case
    await complianceCaseRepository.createCase({
      institutionId: 'inst-001',
      title: 'Active Investigation',
      description: 'Audit query pending',
    });

    const origFdr = { id: 'fdr-rel-block', institutionId: 'inst-001', amountPaise: 100000000 };
    const elig = await evaluateReleaseEligibility({ originalFdr: origFdr });

    expect(elig.eligible).toBe(false);
    expect(elig.outcome).toBe(RELEASE_ELIGIBILITY_OUTCOMES.BLOCKED_BY_OPEN_CASE);
  });

  // 23. Release request creation
  it('23. Creates administrative release request with sequential reference and disclaimer', async () => {
    const rel = await releaseRequestRepository.createRequest({
      institutionId: 'inst-001',
      originalFdrId: 'fdr-demo-05',
      originalFdrNumber: 'FDR-BOB-2021-3321',
      releaseReason: 'Renewal completed with successor FDR',
      supportingExplanation: 'Replacement certificate accepted for record.',
    });

    expect(rel.requestId).toBeDefined();
    expect(rel.requestReference).toMatch(/^REL-\d{4}-\d{6}$/);
    expect(rel.disclaimer).toContain('No Real Banking Operations Performed');
    expect(rel.status).toBe(RELEASE_STATUS.SUBMITTED);
  });

  // 24. Administrative clearance safeguards
  it('24. Requires mandatory justification for administrative clearance and validates transitions', async () => {
    const rel = await releaseRequestRepository.createRequest({
      institutionId: 'inst-001',
      originalFdrId: 'fdr-clear-safe',
      originalFdrNumber: 'FDR-SAFE',
      releaseReason: 'Program closure approved',
    });

    await releaseRequestRepository.transitionStatus(rel.requestId, RELEASE_STATUS.UNDER_REVIEW, {
      actorId: 'officer-1',
      actorRole: 'officer',
    });

    // Attempt clearance with empty reason
    await expect(
      releaseRequestRepository.transitionStatus(rel.requestId, RELEASE_STATUS.ADMINISTRATIVELY_CLEARED, {
        actorId: 'officer-1',
        actorRole: 'officer',
        reason: '',
      })
    ).rejects.toThrow(/Mandatory rationale/);

    // Valid clearance
    const cleared = await releaseRequestRepository.transitionStatus(
      rel.requestId,
      RELEASE_STATUS.ADMINISTRATIVELY_CLEARED,
      {
        actorId: 'officer-1',
        actorRole: 'officer',
        reason: 'Closure documents verified under approved AICTE gazette.',
      }
    );
    expect(cleared.status).toBe(RELEASE_STATUS.ADMINISTRATIVELY_CLEARED);
    expect(cleared.clearanceReason).toContain('Closure documents verified');
  });

  // 25. Escalation generation
  it('25. Generates high-priority escalations for matured FDRs without active renewals', () => {
    const maturedFdr = {
      id: 'fdr-matured-esc',
      fdrNumber: 'FDR-MAT-1',
      institutionId: 'inst-001',
      institutionName: 'Demo Institute',
      maturityDate: '2026-02-01',
    };

    const escalations = evaluateRenewalEscalations({
      fdrs: [maturedFdr],
      renewalRequests: [],
      referenceDate: new Date('2026-03-01'),
    });

    expect(escalations.length).toBeGreaterThan(0);
    const esc = escalations[0];
    expect(esc.severity).toBe(ESCALATION_LEVELS.URGENT);
    expect(esc.reason).toContain('Deposit matured');
  });

  // 26. Notification idempotency
  it('26. Escalation sync merges newly identified escalations idempotently', async () => {
    const esc1 = {
      escalationId: 'ESC-SYNC-01',
      entityId: 'fdr-1',
      institutionId: 'inst-001',
      reason: 'Urgent renewal',
      status: 'OPEN',
    };

    await renewalEscalationRepository.syncEscalations([esc1]);
    await renewalEscalationRepository.syncEscalations([esc1]); // second sync

    const all = await renewalEscalationRepository.getAllEscalations();
    const count = all.filter((e) => e.escalationId === 'ESC-SYNC-01').length;
    expect(count).toBe(1);
  });

  // 27. Audit event history
  it('27. Officer renewal review recording produces immutable audit events', async () => {
    const rev = await renewalReviewRepository.recordReview({
      renewalRequestId: 'RNL-DEMO-001',
      officerId: 'officer-test-1',
      decision: RENEWAL_STATUS.ACCEPTED_FOR_RECORD,
      justificationReason: 'Deposit continuity and beneficiary verified.',
    });

    expect(rev.reviewId).toBeDefined();

    const logs = await auditRepository.getAuditLogs();
    const revLog = logs.find((l) => l.metadata?.reviewId === rev.reviewId);
    expect(revLog).toBeDefined();
    expect(revLog.eventType).toBe('RENEWAL_OFFICER_REVIEW_RECORDED');
  });

  // 28. Institution ownership isolation
  it('28. Restricts renewal requests and plans by institutional identity', async () => {
    const inst1Reqs = await renewalRequestRepository.getRequestsByInstitutionId('inst-001');
    const inst2Reqs = await renewalRequestRepository.getRequestsByInstitutionId('inst-002');

    expect(inst1Reqs.every((r) => r.institutionId === 'inst-001')).toBe(true);
    expect(inst2Reqs.every((r) => r.institutionId === 'inst-002')).toBe(true);
  });

  // 29. Officer route protection
  it('29. RoleGuard blocks institutions from officer renewal routes', async () => {
    await authRepository.authenticate({
      email: 'principal@coep-pune.demo',
      accessCode: 'demo@123',
      role: 'institution',
      rememberMe: true,
    });

    render(
      <MemoryRouter initialEntries={['/officer/renewals']}>
        <AuthProvider>
          <Routes>
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route
              path="/officer/renewals"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['officer']}>
                    <div>OFFICER_RENEWALS_AREA</div>
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/restricted workspace access/i)).toBeInTheDocument();
    expect(screen.queryByText('OFFICER_RENEWALS_AREA')).not.toBeInTheDocument();
  });

  // 30. Administrator route protection
  it('30. RoleGuard blocks non-admins from admin renewal monitoring route', async () => {
    await authRepository.authenticate({
      email: 'scrutiny.west@aicte.demo',
      accessCode: 'officer@123',
      role: 'officer',
      rememberMe: true,
    });

    render(
      <MemoryRouter initialEntries={['/admin/renewal-monitoring']}>
        <AuthProvider>
          <Routes>
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route
              path="/admin/renewal-monitoring"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin']}>
                    <div>ADMIN_RENEWAL_AREA</div>
                  </RoleGuard>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/restricted workspace access/i)).toBeInTheDocument();
    expect(screen.queryByText('ADMIN_RENEWAL_AREA')).not.toBeInTheDocument();
  });



  // 31. Report export
  it('31. Generates audit-ready continuity statement with disclaimers and integer paise formatting', () => {
    const stmt = renewalReportBuilder.buildContinuityStatement({
      originalFdr: {
        id: 'fdr-rep',
        fdrNumber: 'FDR-SBI-REP',
        depositAmountPaise: 350000000,
        maturityDate: '2026-04-15',
      },
      replacementFdrs: [
        {
          id: 'rep-fdr',
          fdrNumber: 'FDR-SBI-REP-2',
          depositAmountPaise: 350000000,
          maturityDate: '2031-04-15',
        },
      ],
      continuityResult: {
        continuityStatus: CONTINUITY_STATUS.CONTINUOUS_DECLARED_COVERAGE,
        requiredDepositPaise: 350000000,
        replacementTotalPaise: 350000000,
        maxShortfallPaise: 0,
      },
    });

    expect(stmt.disclaimer).toBe(RENEWAL_PROTOTYPE_DISCLAIMER);
    expect(stmt.originalCertificate.amountRupees).toBe('35,00,000');
    expect(stmt.continuityAssessment.status).toBe(CONTINUITY_STATUS.CONTINUOUS_DECLARED_COVERAGE);

    const csv = renewalReportBuilder.exportRenewalRequestsToCsv([
      {
        renewalReference: 'RNL-2026-000001',
        originalFdrNumber: 'FDR-1',
        institutionName: 'SPIT',
        renewalType: 'REPLACEMENT_FDR',
        originalAmountPaise: 350000000,
        replacementTotalPaise: 350000000,
      },
    ]);
    expect(csv).toContain('RNL-2026-000001');
    expect(csv).toContain('3500000.00');
  });

  // 32. English/Hindi/Marathi translations
  it('32. Translations dictionary includes all Module 07 renewal keys across EN, HI, MR', () => {
    const requiredKeys = [
      'dash.menu.renewals',
      'dash.menu.releases',
      'dash.menu.officerRenewals',
      'dash.menu.officerReleases',
      'dash.menu.renewalMonitoring',
      'renewal.title',
      'renewal.status.draft',
      'renewal.status.submitted',
      'renewal.continuity.continuous',
    ];

    for (const key of requiredKeys) {
      expect(en[key]).toBeDefined();
      expect(hi[key]).toBeDefined();
      expect(mr[key]).toBeDefined();
    }
  });

  // 33. Module 01 regression
  it('33. Module 01 regression: Public homepage renders national branding landmarks', () => {
    renderWithProviders(<HomePage />, { route: '/' });
    expect(screen.getAllByText(/NidhiSetu/i).length).toBeGreaterThan(0);
  });

  // 34. Module 02 regression
  it('34. Module 02 regression: User authentication and role sessions remain intact', async () => {
    const users = await userRepository.getAllUsers();
    expect(users.length).toBeGreaterThan(0);
    expect(users.some((u) => u.role === 'institution')).toBe(true);
    expect(users.some((u) => u.role === 'officer')).toBe(true);
    expect(users.some((u) => u.role === 'admin')).toBe(true);
  });

  // 35. Module 03 regression
  it('35. Module 03 regression: FDR repository and lifecycle states continue working', async () => {
    const fdrs = await fdrRepository.getAllFdrRecords();
    expect(fdrs.length).toBeGreaterThan(0);
  });

  // 36. Module 04 regression
  it('36. Module 04 regression: Document intelligence repository remains accessible', async () => {
    const analyses = await documentAnalysisRepository.getAllAnalyses();
    expect(Array.isArray(analyses)).toBe(true);
  });

  // 37. Module 05 regression
  it('37. Module 05 regression: Simulated banking confirmations remain operational', async () => {
    const bankReqs = await bankVerificationRepository.getAllRequests();
    expect(Array.isArray(bankReqs)).toBe(true);
  });

  // 38. Module 06 regression
  it('38. Module 06 regression: Compliance rules, assessments, and cases remain functional', async () => {
    const rules = await complianceRuleRepository.getAllRules();
    expect(rules.length).toBeGreaterThan(0);
    const cases = await complianceCaseRepository.getAllCases();
    expect(Array.isArray(cases)).toBe(true);
  });

  // 39. Comprehensive End-to-End Workflow
  it('39. End-to-End Workflow: FDR approaches maturity -> renewal submitted -> officer scrutiny -> continuity verified -> administrative release cleared', async () => {
    // A. Create source FDR maturing in 20 days
    const origFdr = await fdrRepository.createFDR({
      fdrNumber: 'FDR-E2E-RNL-001',
      institutionId: 'inst-001',
      institutionName: 'Sardar Patel Institute of Technology',
      bankName: 'State Bank of India',
      depositAmountPaise: 350000000,
      depositDate: '2023-04-15',
      maturityDate: '2026-04-15',
      status: 'APPROVED',
    });

    // B. Smart renewal planner identifies upcoming maturity
    const plan = buildRenewalPlan(origFdr, [], new Date('2026-03-25'));
    expect(plan.daysUntilMaturity).toBe(21);
    expect(plan.priorityLevel).toBe(RENEWAL_PRIORITY.HIGH);

    // C. Create replacement FDR
    const repFdr = await fdrRepository.createFDR({
      fdrNumber: 'FDR-E2E-RNL-002',
      institutionId: 'inst-001',
      institutionName: 'Sardar Patel Institute of Technology',
      bankName: 'State Bank of India',
      depositAmountPaise: 350000000,
      depositDate: '2026-04-10',
      issueDate: '2026-04-10',
      effectiveDate: '2026-04-10',
      maturityDate: '2031-04-10',
      status: 'APPROVED',
    });

    // D. Institution submits renewal application
    const renewalApp = await renewalRequestRepository.createRequest({
      institutionId: 'inst-001',
      institutionName: 'Sardar Patel Institute of Technology',
      originalFdrId: origFdr.id,
      originalFdrNumber: origFdr.fdrNumber,
      replacementFdrIds: [repFdr.id],
      renewalType: RENEWAL_TYPES.REPLACEMENT_FDR,
      originalAmountPaise: 350000000,
      replacementTotalPaise: 350000000,
      requestedBy: 'inst-user-01',
    });
    expect(renewalApp.status).toBe(RENEWAL_STATUS.SUBMITTED);

    // E. Officer reviews and accepts for record
    await renewalRequestRepository.transitionStatus(renewalApp.renewalRequestId, RENEWAL_STATUS.UNDER_REVIEW, {
      actorId: 'officer-01',
      actorRole: 'officer',
      reason: 'Commencing scrutiny of replacement deposit documentation.',
    });

    const accepted = await renewalRequestRepository.transitionStatus(
      renewalApp.renewalRequestId,
      RENEWAL_STATUS.ACCEPTED_FOR_RECORD,
      {
        actorId: 'officer-01',
        actorRole: 'officer',
        reason: 'Uninterrupted continuity verified with continuous joint lien.',
      }
    );
    expect(accepted.status).toBe(RENEWAL_STATUS.ACCEPTED_FOR_RECORD);

    // Record review decision
    await renewalReviewRepository.recordReview({
      renewalRequestId: renewalApp.renewalRequestId,
      officerId: 'officer-01',
      decision: RENEWAL_STATUS.ACCEPTED_FOR_RECORD,
      justificationReason: 'Replacement deposit fully satisfies statutory norms.',
    });

    // F. Institution initiates administrative release request for superseded FDR
    const releaseReq = await releaseRequestRepository.createRequest({
      institutionId: 'inst-001',
      institutionName: 'Sardar Patel Institute of Technology',
      originalFdrId: origFdr.id,
      originalFdrNumber: origFdr.fdrNumber,
      amountPaise: origFdr.depositAmountPaise,
      releaseReason: 'Renewal completed with successor FDR #FDR-E2E-RNL-002',
      relatedRenewalRequestId: renewalApp.renewalRequestId,
      supportingExplanation: 'Successor deposit is officially accepted for record.',
    });
    expect(releaseReq.status).toBe(RELEASE_STATUS.SUBMITTED);

    // G. Officer adjudicates release request and administratively clears record
    await releaseRequestRepository.transitionStatus(releaseReq.requestId, RELEASE_STATUS.UNDER_REVIEW, {
      actorId: 'officer-01',
      actorRole: 'officer',
    });

    const clearedRel = await releaseRequestRepository.transitionStatus(
      releaseReq.requestId,
      RELEASE_STATUS.ADMINISTRATIVELY_CLEARED,
      {
        actorId: 'officer-01',
        actorRole: 'officer',
        reason: 'Successor deposit active in regulatory records. Administrative tracking cleared.',
      }
    );
    expect(clearedRel.status).toBe(RELEASE_STATUS.ADMINISTRATIVELY_CLEARED);
    expect(clearedRel.disclaimer).toContain(ADMIN_RELEASE_DISCLAIMER);

    // H. Audit trail is verified
    const allAudit = await auditRepository.getAuditLogs();
    const releaseAudit = allAudit.find((l) => l.targetEntityId === releaseReq.requestId);
    expect(releaseAudit).toBeDefined();
  });

});
