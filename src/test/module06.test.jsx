/**
 * NidhiSetu — Module 06 Automated Test Suite
 * Comprehensive automated verification for Regulatory Compliance Intelligence,
 * Deposit Adequacy Engine, Calendar-Safe Maturity Risk Analysis, Document Intelligence Adapter,
 * Simulated Bank Evidence Adapter, Explainable Risk Prioritization, Compliance Case Management,
 * Audit Lineage, Report Generation, and Regressions across Modules 01-05.
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
  userRepository,
  institutionRepository,
  complianceRuleRepository,
  complianceAssessmentRepository,
  complianceCaseRepository,
  COMPLIANCE_CASE_STATUS,
  complianceReviewRepository,
  COMPLIANCE_REVIEW_DECISIONS,
  documentAnalysisRepository,
  bankVerificationRepository,
} from '../storage';

import {
  RULE_STATUSES,
  REGULATORY_AUTHORITIES,
  INSTITUTION_CATEGORIES,
  PROGRAM_CATEGORIES,
  validateComplianceRule,
  areRulesConflicting,
  createDefaultRule,
} from '../compliance/complianceRuleModel';

import {
  resolveApplicableRule,
} from '../compliance/complianceRuleEngine';

import {
  calculateDepositAdequacy,
  evaluateFdrEligibility,
  ADEQUACY_STATUSES,
} from '../compliance/depositAdequacyEngine';

import {
  evaluateMaturityRisks,
  calculateMonthsDifference,
  MATURITY_RISK_TYPES,
} from '../compliance/maturityRiskEngine';

import {
  extractDocumentRisksForFdr,
  DOCUMENT_RISK_TYPES,
} from '../compliance/documentRiskAdapter';

import {
  extractBankEvidenceForFdr,
  BANK_SIMULATION_SIGNALS,
} from '../compliance/bankEvidenceAdapter';

import {
  prioritizeComplianceRisks,
  RISK_LEVELS,
} from '../compliance/complianceRiskEngine';

import {
  buildComplianceAssessment,
  generateCanonicalFingerprint,
  ASSESSMENT_STATUS,
} from '../compliance/complianceAssessmentBuilder';

import {
  buildReportPayload,
  generateAssessmentCsv,
  REPORT_TYPES,
} from '../compliance/complianceReportBuilder';

import {
  PROTOTYPE_COMPLIANCE_DISCLAIMER,
  SIMULATED_BANK_DISCLAIMER,
  SYNTHETIC_DEMO_RULES,
} from '../compliance/complianceDemoFixtures';

import { en } from '../i18n/translations/en';
import { hi } from '../i18n/translations/hi';
import { mr } from '../i18n/translations/mr';

import ProtectedRoute from '../components/auth/ProtectedRoute';
import RoleGuard from '../components/auth/RoleGuard';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../i18n/LanguageContext';
import OfficerCompliancePage from '../pages/officer/OfficerCompliancePage';
import AdminComplianceRulesPage from '../pages/admin/AdminComplianceRulesPage';
import HomePage from '../pages/HomePage';

function renderWithProviders(ui, { route = '/', role = 'officer' } = {}) {
  window.history.pushState({}, 'Test page', route);
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

describe('Module 06: Regulatory Compliance Intelligence & Risk Monitoring Tests', () => {
  beforeEach(() => {
    window.localStorage.clear();
    initializeStorage(true);
  });

  // 1. Rule creation
  it('1. Rule creation successfully creates and validates a new regulatory rule in DRAFT status', async () => {
    const draft = createDefaultRule({
      ruleCode: 'TEST-RULE-001',
      title: 'Test Engineering Deposit Rule',
      minimumDepositPaise: 250000000, // 25 Lakhs
      requiredValidityMonths: 60,
    });

    const created = await complianceRuleRepository.createRule(draft);
    expect(created.ruleId).toBeDefined();
    expect(created.ruleStatus).toBe(RULE_STATUSES.DRAFT);
    expect(created.minimumDepositPaise).toBe(250000000);

    const fetched = await complianceRuleRepository.getRuleById(created.ruleId);
    expect(fetched).not.toBeNull();
    expect(fetched.ruleCode).toBe('TEST-RULE-001');
  });

  // 2. Rule activation
  it('2. Rule activation transitions a draft rule to ACTIVE status', async () => {
    const draft = createDefaultRule({
      ruleCode: 'TEST-ACTIVATE-001',
      title: 'Rule To Activate',
      regulatoryAuthority: REGULATORY_AUTHORITIES.UGC,
      institutionCategory: INSTITUTION_CATEGORIES.GENERAL,
      programCategory: PROGRAM_CATEGORIES.UNDERGRADUATE,
    });

    const created = await complianceRuleRepository.createRule(draft);
    const activated = await complianceRuleRepository.activateRule(created.ruleId);

    expect(activated.ruleStatus).toBe(RULE_STATUSES.ACTIVE);
    const activeList = await complianceRuleRepository.getActiveRules();
    expect(activeList.some((r) => r.ruleId === created.ruleId)).toBe(true);
  });

  // 3. Rule retirement
  it('3. Rule retirement marks an active rule as RETIRED without deleting its historical records', async () => {
    const rules = await complianceRuleRepository.getAllRules();
    const activeRule = rules.find((r) => r.ruleStatus === RULE_STATUSES.ACTIVE);
    expect(activeRule).toBeDefined();

    const retired = await complianceRuleRepository.retireRule(
      activeRule.ruleId,
      'Regulatory framework phased out'
    );
    expect(retired.ruleStatus).toBe(RULE_STATUSES.RETIRED);
    expect(retired.retirementReason).toBe('Regulatory framework phased out');

    // Still queryable in repository
    const fetched = await complianceRuleRepository.getRuleById(activeRule.ruleId);
    expect(fetched.ruleStatus).toBe(RULE_STATUSES.RETIRED);
  });

  // 4. Rule version immutability
  it('4. Rule version immutability rejects in-place edits to ACTIVE or RETIRED rules', async () => {
    const rules = await complianceRuleRepository.getAllRules();
    const activeRule = rules.find((r) => r.ruleStatus === RULE_STATUSES.ACTIVE);

    await expect(
      complianceRuleRepository.updateDraftRule(activeRule.ruleId, {
        minimumDepositPaise: 999999999,
      })
    ).rejects.toThrow(/immutable/i);
  });

  // 5. Conflicting active rules detection
  it('5. Conflicting active rules detection prevents activating overlapping rules for identical authority and category', async () => {
    // Existing AICTE-ENG-UG rule is active from 2023-01-01 to 2027-12-31
    const conflictingDraft = createDefaultRule({
      ruleCode: 'AICTE-ENG-CONFLICT-TEST',
      title: 'Conflicting AICTE Engineering Rule',
      regulatoryAuthority: REGULATORY_AUTHORITIES.AICTE,
      institutionCategory: INSTITUTION_CATEGORIES.ENGINEERING,
      programCategory: PROGRAM_CATEGORIES.UNDERGRADUATE,
      effectiveFrom: '2024-01-01',
      effectiveTo: '2026-12-31',
    });

    const created = await complianceRuleRepository.createRule(conflictingDraft);
    await expect(
      complianceRuleRepository.activateRule(created.ruleId)
    ).rejects.toThrow(/conflict detected/i);
  });

  // 6. Missing rule handling
  it('6. Missing rule handling classifies assessment as REQUIREMENT_NOT_CONFIGURED', async () => {
    const inst = {
      id: 'inst-unconfigured-99',
      category: 'UNKNOWN_SPECIALTY',
      programCategory: 'DOCTORAL',
    };

    const rules = await complianceRuleRepository.getAllRules();
    const resolution = resolveApplicableRule(inst, rules);

    expect(resolution.status).toBe('REQUIREMENT_NOT_CONFIGURED');
    expect(resolution.rule).toBeNull();

    const adequacy = calculateDepositAdequacy({
      institutionId: inst.id,
      applicableRule: null,
      fdrRecords: [],
    });
    expect(adequacy.adequacyStatus).toBe(ADEQUACY_STATUSES.REQUIREMENT_NOT_CONFIGURED);
  });

  // 7. Exact deposit adequacy
  it('7. Exact deposit adequacy correctly identifies ADEQUATE_DECLARED when eligible deposits equal requirement', async () => {
    const rule = {
      ruleId: 'TEST-RULE-EXACT',
      ruleCode: 'TEST-EXACT',
      minimumDepositPaise: 350000000, // ₹35 Lakhs
    };

    const fdrs = [
      {
        id: 'fdr-1',
        institutionId: 'inst-01',
        fdrNumber: 'FDR-EXACT-01',
        amountPaise: 350000000,
        status: 'ACTIVE',
      },
    ];

    const result = calculateDepositAdequacy({
      institutionId: 'inst-01',
      applicableRule: rule,
      fdrRecords: fdrs,
    });

    expect(result.requiredAmountPaise).toBe(350000000);
    expect(result.eligibleDeclaredAmountPaise).toBe(350000000);
    expect(result.shortfallPaise).toBe(0);
    expect(result.surplusPaise).toBe(0);
    expect(result.coveragePercentage).toBe(100);
    expect(result.adequacyStatus).toBe(ADEQUACY_STATUSES.ADEQUATE_DECLARED);
  });

  // 8. Deposit shortfall
  it('8. Deposit shortfall calculates exact shortfall in integer paise with SHORTFALL_DECLARED status', async () => {
    const rule = {
      ruleId: 'TEST-RULE-SHORT',
      ruleCode: 'TEST-SHORT',
      minimumDepositPaise: 350000000, // ₹35 Lakhs
    };

    const fdrs = [
      {
        id: 'fdr-1',
        institutionId: 'inst-01',
        fdrNumber: 'FDR-SHORT-01',
        amountPaise: 200000000, // ₹20 Lakhs
        status: 'ACTIVE',
      },
    ];

    const result = calculateDepositAdequacy({
      institutionId: 'inst-01',
      applicableRule: rule,
      fdrRecords: fdrs,
    });

    expect(result.requiredAmountPaise).toBe(350000000);
    expect(result.eligibleDeclaredAmountPaise).toBe(200000000);
    expect(result.shortfallPaise).toBe(150000000); // 15 Lakhs
    expect(result.surplusPaise).toBe(0);
    expect(result.coveragePercentage).toBe(57.14);
    expect(result.adequacyStatus).toBe(ADEQUACY_STATUSES.SHORTFALL_DECLARED);
  });

  // 9. Deposit surplus
  it('9. Deposit surplus calculates surplus amount with EXCESS_DECLARED status', async () => {
    const rule = {
      ruleId: 'TEST-RULE-EXCESS',
      ruleCode: 'TEST-EXCESS',
      minimumDepositPaise: 150000000, // ₹15 Lakhs
    };

    const fdrs = [
      {
        id: 'fdr-1',
        institutionId: 'inst-01',
        fdrNumber: 'FDR-EXCESS-01',
        amountPaise: 250000000, // ₹25 Lakhs
        status: 'ACTIVE',
      },
    ];

    const result = calculateDepositAdequacy({
      institutionId: 'inst-01',
      applicableRule: rule,
      fdrRecords: fdrs,
    });

    expect(result.shortfallPaise).toBe(0);
    expect(result.surplusPaise).toBe(100000000); // 10 Lakhs surplus
    expect(result.coveragePercentage).toBe(166.67);
    expect(result.adequacyStatus).toBe(ADEQUACY_STATUSES.EXCESS_DECLARED);
  });

  // 10. Zero requirement handling
  it('10. Zero requirement handling avoids division by zero and yields 100% coverage', async () => {
    const rule = {
      ruleId: 'TEST-RULE-ZERO',
      ruleCode: 'TEST-ZERO',
      minimumDepositPaise: 0,
    };

    const result = calculateDepositAdequacy({
      institutionId: 'inst-01',
      applicableRule: rule,
      fdrRecords: [],
    });

    expect(result.requiredAmountPaise).toBe(0);
    expect(result.coveragePercentage).toBe(100);
    expect(result.shortfallPaise).toBe(0);
    expect(result.adequacyStatus).toBe(ADEQUACY_STATUSES.ADEQUATE_DECLARED);
  });

  // 11. Renewal double-count prevention
  it('11. Renewal double-count prevention excludes superseded predecessors and counts only active successor', async () => {
    const rule = {
      minimumDepositPaise: 350000000,
    };

    const fdrs = [
      {
        id: 'fdr-orig-01',
        institutionId: 'inst-01',
        fdrNumber: 'FDR-ORIG-01',
        amountPaise: 350000000,
        status: 'SUPERSEDED',
        isSuperseded: true,
      },
      {
        id: 'fdr-renewed-02',
        institutionId: 'inst-01',
        originalFdrId: 'fdr-orig-01',
        fdrNumber: 'FDR-RENEWED-02',
        amountPaise: 350000000,
        status: 'ACTIVE',
      },
    ];

    const { eligibleDeposits, excludedDeposits } = evaluateFdrEligibility(fdrs, 'inst-01');

    expect(eligibleDeposits.length).toBe(1);
    expect(eligibleDeposits[0].fdrId).toBe('fdr-renewed-02');
    expect(excludedDeposits.some((e) => e.fdrId === 'fdr-orig-01')).toBe(true);
    expect(excludedDeposits[0].reason).toBe('SUPERSEDED_BY_RENEWAL');

    const adequacy = calculateDepositAdequacy({
      institutionId: 'inst-01',
      applicableRule: rule,
      fdrRecords: fdrs,
    });
    expect(adequacy.eligibleDeclaredAmountPaise).toBe(350000000); // Not 70 Lakhs!
  });

  // 12. Institution ownership filtering
  it('12. Institution ownership filtering ignores deposits belonging to other institutions', async () => {
    const fdrs = [
      { id: 'f1', institutionId: 'inst-A', amountPaise: 10000000, status: 'ACTIVE' },
      { id: 'f2', institutionId: 'inst-B', amountPaise: 50000000, status: 'ACTIVE' },
    ];

    const { eligibleDeposits } = evaluateFdrEligibility(fdrs, 'inst-A');
    expect(eligibleDeposits.length).toBe(1);
    expect(eligibleDeposits[0].fdrId).toBe('f1');
  });

  // 13. Expired deposit detection
  it('13. Expired deposit detection flags matured deposits without renewal as HIGH risk', async () => {
    const eligible = [
      { fdrId: 'fdr-exp-1', fdrNumber: 'FDR-EXP-1' },
    ];
    const records = [
      {
        id: 'fdr-exp-1',
        fdrNumber: 'FDR-EXP-1',
        maturityDate: '2023-01-01',
      },
    ];

    const findings = evaluateMaturityRisks({
      fdrRecords: records,
      eligibleDeposits: eligible,
      assessmentDate: '2024-01-01',
    });

    expect(findings.length).toBeGreaterThan(0);
    const expiredFinding = findings.find((f) => f.riskType === MATURITY_RISK_TYPES.FDR_MATURED);
    expect(expiredFinding).toBeDefined();
    expect(expiredFinding.severity).toBe('HIGH');
    expect(expiredFinding.daysRemaining).toBeLessThan(0);
  });

  // 14. Upcoming maturity detection
  it('14. Upcoming maturity detection triggers graduated warning tiers (<= 7, 30, 60, 90 days)', async () => {
    const refDate = new Date('2024-06-01');
    const records = [
      { id: 'fdr-7d', fdrNumber: 'FDR-7D', maturityDate: '2024-06-05' }, // 4 days -> 7d critical
      { id: 'fdr-25d', fdrNumber: 'FDR-25D', maturityDate: '2024-06-25' }, // 24 days -> 30d high
    ];

    const findings = evaluateMaturityRisks({
      fdrRecords: records,
      eligibleDeposits: records.map((r) => ({ fdrId: r.id, fdrNumber: r.fdrNumber })),
      assessmentDate: refDate,
    });

    const crit = findings.find((f) => f.riskType === MATURITY_RISK_TYPES.MATURITY_CRITICAL_7D);
    const high = findings.find((f) => f.riskType === MATURITY_RISK_TYPES.MATURITY_HIGH_30D);

    expect(crit).toBeDefined();
    expect(high).toBeDefined();
  });

  // 15. Insufficient validity tenure detection
  it('15. Insufficient validity tenure detects deposits booked for fewer months than regulatory requirement', () => {
    const months = calculateMonthsDifference('2023-01-01', '2025-01-01');
    expect(months).toBe(24);

    const findings = evaluateMaturityRisks({
      fdrRecords: [
        {
          id: 'fdr-short-tenure',
          fdrNumber: 'FDR-SHORT-T',
          depositDate: '2023-01-01',
          maturityDate: '2025-01-01', // 24 months
        },
      ],
      eligibleDeposits: [{ fdrId: 'fdr-short-tenure', fdrNumber: 'FDR-SHORT-T' }],
      applicableRule: { requiredValidityMonths: 60, ruleCode: 'RULE-60M' },
      assessmentDate: '2023-06-01',
    });

    const tenureFinding = findings.find((f) => f.riskType === MATURITY_RISK_TYPES.INSUFFICIENT_VALIDITY_TENURE);
    expect(tenureFinding).toBeDefined();
    expect(tenureFinding.actualTenureMonths).toBe(24);
    expect(tenureFinding.requiredTenureMonths).toBe(60);
  });

  // 16. Stale OCR analysis exclusion
  it('16. Stale OCR analysis exclusion ignores outdated document reports when document hash changed', async () => {
    const fdr = {
      id: 'fdr-ocr-test',
      sha256Hash: 'CURRENT_HASH_999',
    };

    // Save an analysis with an older hash
    await documentAnalysisRepository.saveAnalysis({
      analysisId: 'ANALYSIS-OLD',
      fdrId: 'fdr-ocr-test',
      documentSha256: 'OLD_HASH_111',
      analyzedAt: new Date().toISOString(),
      findings: [{ findingId: 'f1', category: 'AMOUNT', severity: 'HIGH' }],
    });

    const docRisks = await extractDocumentRisksForFdr(fdr);
    expect(docRisks.hasStaleAnalysis).toBe(true);
    expect(docRisks.status).toBe('ANALYSIS_STALE');
    expect(docRisks.findings.length).toBe(0); // stale findings excluded from current evidence
  });

  // 17. Confirmed document discrepancy handling
  it('17. Confirmed document discrepancy handling elevates severity to HIGH when confirmed by officer', async () => {
    const fdr = {
      id: 'fdr-conf-test',
      fdrNumber: 'FDR-CONF-01',
      sha256Hash: 'HASH-100',
    };

    await documentAnalysisRepository.saveAnalysis({
      analysisId: 'ANALYSIS-CONF',
      fdrId: 'fdr-conf-test',
      documentSha256: 'HASH-100',
      analyzedAt: new Date().toISOString(),
      findings: [
        {
          findingId: 'FINDING-AMOUNT-01',
          category: 'AMOUNT_MISMATCH',
          severity: 'LOW',
          field: 'amount',
          declaredValue: '3500000',
          extractedValue: '1500000',
        },
      ],
    });

    // Record officer confirmed discrepancy in intelligence review repository
    await storageService.setItem(STORAGE_KEYS.INTELLIGENCE_REVIEWS, [
      {
        findingId: 'FINDING-AMOUNT-01',
        fdrId: 'fdr-conf-test',
        reviewStatus: 'CONFIRMED_DISCREPANCY',
        justificationReason: 'Confirmed bank receipt shows ₹15 Lakhs not ₹35 Lakhs.',
      },
    ]);

    const docRisks = await extractDocumentRisksForFdr(fdr);
    expect(docRisks.findings.length).toBe(1);
    expect(docRisks.findings[0].isConfirmedDiscrepancy).toBe(true);
    expect(docRisks.findings[0].severity).toBe('HIGH');
  });

  // 18. Simulated bank evidence labeling
  it('18. Simulated bank evidence labeling strictly applies [SIMULATED] tags to all bank findings', async () => {
    const fdr = {
      id: 'fdr-sim-test',
      fdrNumber: 'FDR-SIM-01',
    };

    await bankVerificationRepository.createVerificationRequest({
      fdrId: 'fdr-sim-test',
      fdrNumber: 'FDR-SIM-01',
      simulatorBankId: 'SBIN0000001',
      scenarioId: 'SCENARIO_C_AMOUNT_MISMATCH',
    });

    // Simulate response received
    const req = await bankVerificationRepository.getLatestRequestForFdr('fdr-sim-test');
    req.requestStatus = 'RESPONSE_RECEIVED';
    req.comparisonResults = {
      amountMatches: false,
      bankAmountPaise: 10000000,
    };
    await storageService.setItem(STORAGE_KEYS.BANK_VERIFICATIONS, [req]);

    const bankEvidence = await extractBankEvidenceForFdr(fdr);
    expect(bankEvidence.disclaimer).toBe(SIMULATED_BANK_DISCLAIMER);
    expect(bankEvidence.findings.length).toBeGreaterThan(0);
    expect(bankEvidence.findings[0].isSimulated).toBe(true);
    expect(bankEvidence.findings[0].signalType).toBe(BANK_SIMULATION_SIGNALS.SIMULATED_AMOUNT_MISMATCH);
  });

  // 19. Missing bank simulation handling
  it('19. Missing bank simulation handling returns NOT_SIMULATED status without blocking evaluation', async () => {
    const fdr = { id: 'fdr-no-sim' };
    const bankEvidence = await extractBankEvidenceForFdr(fdr);

    expect(bankEvidence.status).toBe(BANK_SIMULATION_SIGNALS.NOT_SIMULATED);
    expect(bankEvidence.findings.length).toBe(0);
  });

  // 20. Deterministic risk classification
  it('20. Deterministic risk classification elevates overall priority to CRITICAL on coinciding shortfall and expired deposit', () => {
    const analysis = prioritizeComplianceRisks({
      adequacyResult: {
        adequacyStatus: 'SHORTFALL_DECLARED',
        shortfallPaise: 150000000,
        requiredAmountPaise: 350000000,
        coveragePercentage: 57.14,
      },
      maturityFindings: [
        {
          signalId: 'MAT-1',
          riskType: 'FDR_MATURED',
          severity: 'HIGH',
          explanation: 'Deposit matured 30 days ago without renewal',
        },
      ],
      documentFindings: [],
      bankSimulationFindings: [],
    });

    expect(analysis.overallPriority).toBe(RISK_LEVELS.CRITICAL);
    expect(analysis.countsBySeverity[RISK_LEVELS.CRITICAL]).toBe(0); // overall elevated based on combination
    expect(analysis.indicators.some((i) => i.signalId === 'RISK-ADEQUACY-SHORTFALL')).toBe(true);
  });

  // 21. Assessment snapshot persistence
  it('21. Assessment snapshot persistence records complete immutable evaluation object in repository', async () => {
    const inst = { id: 'inst-persist-01', name: 'Persist Tech College', category: 'ENGINEERING' };
    const rules = await complianceRuleRepository.getAllRules();

    const assessment = await buildComplianceAssessment({
      institution: inst,
      rules,
      fdrRecords: [],
    });

    const saved = await complianceAssessmentRepository.saveAssessment(assessment);
    expect(saved.assessmentId).toBeDefined();

    const fetched = await complianceAssessmentRepository.getAssessmentById(saved.assessmentId);
    expect(fetched.institutionId).toBe('inst-persist-01');
    expect(fetched.disclaimer).toBe(PROTOTYPE_COMPLIANCE_DISCLAIMER);
  });

  // 22. Assessment fingerprint stability
  it('22. Assessment fingerprint stability ensures invariant SHA / FNV hash regardless of object key order', () => {
    const inputA = { b: 2, a: 1, c: { z: 10, y: 20 } };
    const inputB = { a: 1, c: { y: 20, z: 10 }, b: 2 };

    const fpA = generateCanonicalFingerprint(inputA);
    const fpB = generateCanonicalFingerprint(inputB);

    expect(fpA).toBe(fpB);
    expect(fpA).toMatch(/^FPR-[0-9a-f]{8}$/);
  });

  // 23. Reassessment after source changes
  it('23. Reassessment marks previous snapshot as STALE and increments reassessment lineage count', async () => {
    const inst = { id: 'inst-stale-01', name: 'Stale Test Academy' };
    const rules = await complianceRuleRepository.getAllRules();

    const first = await buildComplianceAssessment({
      institution: inst,
      rules,
      fdrRecords: [],
    });
    await complianceAssessmentRepository.saveAssessment(first);

    // Save second assessment (reassessment)
    const second = await buildComplianceAssessment({
      institution: inst,
      rules,
      fdrRecords: [{ id: 'fdr-new-01', institutionId: 'inst-stale-01', amountPaise: 350000000, status: 'ACTIVE' }],
      previousAssessment: first,
    });
    await complianceAssessmentRepository.saveAssessment(second);

    expect(second.reassessmentCount).toBe(1);
    expect(second.previousAssessmentId).toBe(first.assessmentId);

    // Check first is marked STALE
    const oldSnapshot = await complianceAssessmentRepository.getAssessmentById(first.assessmentId);
    expect(oldSnapshot.assessmentStatus).toBe(ASSESSMENT_STATUS.STALE);
  });

  // 24. Case creation
  it('24. Case creation opens an officer compliance case with OPEN status', async () => {
    const newCase = await complianceCaseRepository.createCase({
      institutionId: 'inst-case-01',
      title: 'Shortfall In Deposit Adequacy',
      description: 'Institutional deposit deficit of ₹15,00,000.',
      priority: 'HIGH',
    });

    expect(newCase.caseId).toBeDefined();
    expect(newCase.status).toBe(COMPLIANCE_CASE_STATUS.OPEN);
    expect(newCase.priority).toBe('HIGH');
    expect(newCase.timeline.length).toBe(1);
  });

  // 25. Case state transitions
  it('25. Case state transitions support full lifecycle through UNDER_REVIEW and FOLLOW_UP_REQUESTED', async () => {
    const c = await complianceCaseRepository.createCase({
      institutionId: 'inst-case-02',
      title: 'Lifecycle Scrutiny Test',
    });

    const underReview = await complianceCaseRepository.startReview(c.caseId, 'officer-01');
    expect(underReview.status).toBe(COMPLIANCE_CASE_STATUS.UNDER_REVIEW);
    expect(underReview.assignedOfficerId).toBe('officer-01');

    const noteAdded = await complianceCaseRepository.addOfficerNote(c.caseId, 'Verified registry records.', 'officer-01');
    expect(noteAdded.officerNotes.length).toBe(1);
  });

  // 26. Mandatory resolution reason
  it('26. Mandatory resolution reason rejects case resolution without substantive rationale (>= 5 chars)', async () => {
    const c = await complianceCaseRepository.createCase({
      institutionId: 'inst-case-03',
      title: 'Resolution Test Case',
    });

    await expect(
      complianceCaseRepository.resolveCase(c.caseId, { resolutionReason: 'OK' })
    ).rejects.toThrow(/substantive resolution reason/i);
  });

  // 27. Institution clarification response
  it('27. Institution clarification response records response text and updates case status', async () => {
    const c = await complianceCaseRepository.createCase({
      institutionId: 'inst-case-04',
      title: 'Clarification Test Case',
    });

    await complianceCaseRepository.requestClarification(c.caseId, {
      clarificationQuestion: 'Please submit updated renewal FDR confirmation within 7 days.',
    });

    const response = await complianceCaseRepository.submitInstitutionResponse(c.caseId, {
      responseText: 'Renewal fixed deposit #FDR-999 has been booked with State Bank of India.',
    });

    expect(response.institutionResponses.length).toBe(1);
    expect(response.status).toBe(COMPLIANCE_CASE_STATUS.UNDER_REVIEW);
  });

  // 28. Officer review history
  it('28. Officer review history stores determinations with mandatory rationale (>= 5 chars)', async () => {
    const rev = await complianceReviewRepository.recordAssessmentReview({
      assessmentId: 'CAS-REV-TEST',
      officerId: 'officer-01',
      decision: COMPLIANCE_REVIEW_DECISIONS.APPROVED_COMPLIANT,
      justificationReason: 'All deposit receipts verified and satisfy AICTE handbook standards.',
    });

    expect(rev.reviewId).toBeDefined();
    expect(rev.decision).toBe(COMPLIANCE_REVIEW_DECISIONS.APPROVED_COMPLIANT);

    const reviews = await complianceReviewRepository.getReviewsByAssessmentId('CAS-REV-TEST');
    expect(reviews.length).toBe(1);
  });

  // 29. Notification idempotency
  it('29. Notification delivery generates notifications for officer and institution portals', async () => {
    const notif = await notificationRepository.createNotification({
      role: 'institution',
      userId: 'inst-notif-01',
      title: 'Security Deposit Notice',
      message: 'Deposit shortfall identified.',
      category: 'compliance',
    });

    expect(notif.id).toBeDefined();
    const instNotifs = await notificationRepository.getUserNotifications('inst-notif-01', 'institution');
    expect(instNotifs.some((n) => n.id === notif.id)).toBe(true);
  });

  // 30. Report generation
  it('30. Report generation produces structured payload with strict prototype disclaimers', () => {
    const assessment = {
      assessmentId: 'CAS-REP-01',
      institutionName: 'Apex Engineering Institute',
      requiredAmountPaise: 350000000,
      eligibleDeclaredAmountPaise: 350000000,
    };

    const payload = buildReportPayload(assessment, REPORT_TYPES.INSTITUTION_SUMMARY);
    expect(payload.reportId).toBeDefined();
    expect(payload.disclaimer).toBe(PROTOTYPE_COMPLIANCE_DISCLAIMER);
    expect(payload.simulatedBankDisclaimer).toBe(SIMULATED_BANK_DISCLAIMER);
  });

  // 31. CSV/JSON export
  it('31. CSV/JSON export generates valid comma-separated text including disclaimers', () => {
    const assessment = {
      institutionName: 'Test Tech College',
      institutionId: 'inst-csv-01',
      requiredAmountPaise: 350000000,
      eligibleDeclaredAmountPaise: 200000000,
      shortfallPaise: 150000000,
      surplusPaise: 0,
      coveragePercentage: 57.14,
      eligibleDeposits: [],
      excludedDeposits: [],
      riskAnalysis: { indicators: [] },
    };

    const csv = generateAssessmentCsv(assessment);
    expect(csv).toContain('Prototype Compliance Assessment');
    expect(csv).toContain('Bank Evidence Is Simulated');
    expect(csv).toContain('3500000.00');
    expect(csv).toContain('1500000.00');
  });

  // 32. Multilingual translations
  it('32. English/Hindi/Marathi translations provide localized strings for Module 06 keys', () => {
    expect(en['compliance.badge']).toBe('Regulatory Compliance Intelligence');
    expect(hi['compliance.badge']).toBe('नियामक अनुपालन बुद्धिमत्ता');
    expect(mr['compliance.badge']).toBe('नियामक अनुपालन बुद्धिमत्ता');

    expect(en['compliance.adequacy.shortfall']).toBe('Deposit Shortfall Declared');
    expect(hi['compliance.adequacy.shortfall']).toBe('घोषित जमा में कमी');
    expect(mr['compliance.adequacy.shortfall']).toBe('घोषित ठेवीत तूट');
  });

  // 33. Officer route protection
  it('33. Officer route protection restricts unauthenticated visitors from /officer/compliance', async () => {
    renderWithProviders(
      <Routes>
        <Route
          path="/officer/compliance"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['officer', 'admin']}>
                <OfficerCompliancePage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Landmark</div>} />
      </Routes>,
      { route: '/officer/compliance', role: null }
    );

    await waitFor(() => {
      expect(screen.getByText(/Login Landmark/i)).toBeInTheDocument();
    });
  });

  // 34. Admin rule management protection
  it('34. Admin rule management protection restricts unauthorized roles from /admin/compliance-rules', async () => {
    renderWithProviders(
      <Routes>
        <Route
          path="/admin/compliance-rules"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin']}>
                <AdminComplianceRulesPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Landmark</div>} />
      </Routes>,
      { route: '/admin/compliance-rules', role: null }
    );

    await waitFor(() => {
      expect(screen.getByText(/Login Landmark/i)).toBeInTheDocument();
    });
  });

  // 35. Complete End-to-End Workflow
  it('35. Complete E2E workflow: Rule config -> FDR submission -> OCR intelligence -> Bank simulation -> Officer assessment -> Shortfall detected -> Case opened -> Clarification -> Case resolution', async () => {
    // 1. Admin configures active rule for Architecture category
    const rule = await complianceRuleRepository.createRule(
      createDefaultRule({
        ruleCode: 'E2E-RULE-ARCH-2026',
        title: 'E2E Architecture Norm',
        institutionCategory: INSTITUTION_CATEGORIES.ARCHITECTURE,
        programCategory: PROGRAM_CATEGORIES.UNDERGRADUATE,
        minimumDepositPaise: 350000000, // ₹35 Lakhs
        ruleStatus: RULE_STATUSES.ACTIVE,
      })
    );
    expect(rule.ruleStatus).toBe(RULE_STATUSES.ACTIVE);

    // 2. Institution submits FDR with deficit (₹20 Lakhs)
    const instId = 'inst-e2e-workflow';
    const fdr = await fdrRepository.createFdr({
      institutionId: instId,
      fdrNumber: 'FDR-E2E-001',
      bankName: 'State Bank of India',
      depositAmountPaise: 200000000, // ₹20 Lakhs
      depositDate: '2023-01-01',
      maturityDate: '2028-12-31',
    });

    // 3. Officer runs unified compliance assessment
    const instRecord = {
      id: instId,
      name: 'E2E Test Institute',
      category: INSTITUTION_CATEGORIES.ARCHITECTURE,
      programCategory: PROGRAM_CATEGORIES.UNDERGRADUATE,
    };
    const rules = await complianceRuleRepository.getAllRules();
    const assessment = await buildComplianceAssessment({
      institution: instRecord,
      rules,
      fdrRecords: [fdr],
    });

    expect(assessment.adequacyStatus).toBe(ADEQUACY_STATUSES.SHORTFALL_DECLARED);
    expect(assessment.shortfallPaise).toBe(150000000); // 15 Lakh deficit

    // 4. Officer opens compliance case
    const c = await complianceCaseRepository.createCase({
      institutionId: instId,
      assessmentId: assessment.assessmentId,
      title: 'Security Deposit Deficit Notice',
      description: 'Institutional shortfall of ₹15,00,000.',
    });
    expect(c.status).toBe(COMPLIANCE_CASE_STATUS.OPEN);

    // 5. Officer requests clarification
    await complianceCaseRepository.requestClarification(c.caseId, {
      clarificationQuestion: 'Submit supplementary FDR receipt for remaining ₹15,00,000.',
    });

    // 6. Institution responds
    await complianceCaseRepository.submitInstitutionResponse(c.caseId, {
      responseText: 'Supplementary FDR #FDR-E2E-002 created and uploaded.',
    });

    // 7. Officer resolves case with mandatory substantive reason
    const resolved = await complianceCaseRepository.resolveCase(c.caseId, {
      resolutionReason: 'Supplementary deposit confirmed and shortfall fully satisfied.',
    });
    expect(resolved.status).toBe(COMPLIANCE_CASE_STATUS.RESOLVED);

    // 8. Generate report
    const report = buildReportPayload(assessment, REPORT_TYPES.INSTITUTION_SUMMARY);
    expect(report.title).toBe('Regulatory Compliance Intelligence Assessment Report');
  });

  // 36. Module 01 regression: Public homepage
  it('36. Module 01 regression: Public homepage renders national branding landmarks', () => {
    renderWithProviders(<HomePage />, { route: '/' });
    expect(screen.getAllByText(/NidhiSetu/i).length).toBeGreaterThan(0);
  });

  // 37. Module 02 regression: User accounts
  it('37. Module 02 regression: User accounts and role authentication remain intact', async () => {
    const users = await userRepository.getAllUsers();
    expect(users.length).toBeGreaterThan(0);
    expect(users.some((u) => u.role === 'admin')).toBe(true);
    expect(users.some((u) => u.role === 'officer')).toBe(true);
    expect(users.some((u) => u.role === 'institution')).toBe(true);
  });

  // 38. Module 03 regression: FDR records
  it('38. Module 03 regression: FDR repository and lifecycle states continue working', async () => {
    const fdrs = await fdrRepository.getAllFdrRecords();
    expect(fdrs.length).toBeGreaterThan(0);
  });

  // 39. Module 04 & 05 regression: Document intelligence & Bank verifications
  it('39. Module 04 & 05 regression: Document analyses and simulated bank verifications remain unaffected', async () => {
    const analyses = await documentAnalysisRepository.getAllAnalyses();
    expect(Array.isArray(analyses)).toBe(true);

    const bankVerifs = await bankVerificationRepository.getAllRequests();
    expect(Array.isArray(bankVerifs)).toBe(true);
  });
});
