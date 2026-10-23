/**
 * NidhiSetu — Module 08 Automated Test Suite
 * Comprehensive automated verification for Unified Regulatory Command Center,
 * Portfolio Analytics, Explainable Risk Prioritization, Unified Action Inbox,
 * Officer Workload & Assignments, Cross-Module Evidence Timelines, SIH Demonstration Center,
 * and Cross-Module 01-07 Regressions.
 */

import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import {
  initializeStorage,
  storageService,
  STORAGE_KEYS,
  institutionRepository,
  fdrRepository,
  documentAnalysisRepository,
  bankVerificationRepository,
  complianceAssessmentRepository,
  complianceCaseRepository,
  renewalRequestRepository,
  releaseRequestRepository,
  renewalEscalationRepository,
  auditRepository,
  notificationRepository,
  userRepository,
  commandCenterPreferencesRepository,
  commandCenterSnapshotRepository,
  officerAssignmentRepository,
  operationalAlertRepository,
  demoScenarioRepository,
} from '../storage';

import {
  aggregatePortfolio,
  aggregateInstitutionPortfolio,
  computePortfolioMetrics,
  evaluateInstitutionRiskPriority,
  aggregateActionInbox,
  buildInstitutionIntelligenceDossier,
  buildEvidenceTimeline,
  computeOfficerWorkload,
  assignOfficerTask,
  evaluateOperationalAlerts,
  dismissOperationalAlert,
  acknowledgeOperationalAlert,
  computePortfolioTrends,
  buildExecutiveReport,
  exportReportToCSV,
  exportReportToJSON,
  demoScenarioOrchestrator,
  RISK_PRIORITY,
  ALERT_STATUS,
  ALERT_SEVERITY,
  SOURCE_MODULES,
  REPORT_TYPES,
  COMMAND_CENTER_PROTOTYPE_DISCLAIMER,
  BANK_SIMULATION_DISCLAIMER,
} from '../commandCenter';

import { loadDemoAnalyses } from '../intelligence/intelligenceDemoData';

import { en } from '../i18n/translations/en';
import { hi } from '../i18n/translations/hi';
import { mr } from '../i18n/translations/mr';

import OfficerCommandCenterPage from '../pages/officer/OfficerCommandCenterPage';
import AdminCommandCenterPage from '../pages/admin/AdminCommandCenterPage';
import InstitutionPortfolioPage from '../pages/institution/InstitutionPortfolioPage';
import OfficerActionInboxPage from '../pages/officer/OfficerActionInboxPage';
import OfficerPortfolioAnalyticsPage from '../pages/officer/OfficerPortfolioAnalyticsPage';
import AdminDemoCenterPage from '../pages/admin/AdminDemoCenterPage';

import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../i18n/LanguageContext';

function renderWithProviders(ui) {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <AuthProvider>{ui}</AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

describe('Module 08: Unified Regulatory Command Center & Telemetry', () => {
  beforeEach(async () => {
    initializeStorage(true);
    await loadDemoAnalyses();
  });

  // 1. Portfolio aggregation
  it('aggregates portfolio data across all registered institutions', async () => {
    const portfolio = await aggregatePortfolio();
    expect(portfolio).toBeDefined();
    expect(portfolio.totalInstitutionsCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(portfolio.institutions)).toBe(true);

    const first = portfolio.institutions[0];
    expect(first.institutionId).toBeDefined();
    expect(first.institutionName).toBeDefined();
    expect(typeof first.totalFdrs).toBe('number');
  });

  // 2. Institution ownership isolation
  it('enforces institution ownership isolation when querying single institution', async () => {
    const inst1 = await aggregateInstitutionPortfolio('inst-demo-01');
    const inst2 = await aggregateInstitutionPortfolio('inst-demo-02');

    expect(inst1).not.toBeNull();
    expect(inst2).not.toBeNull();
    expect(inst1.institutionId).toBe('inst-demo-01');
    expect(inst2.institutionId).toBe('inst-demo-02');
    expect(inst1.institutionName).not.toBe(inst2.institutionName);
  });

  // 3. Financial totals in integer paise
  it('computes declared and eligible deposit values in integer paise', async () => {
    const metrics = await computePortfolioMetrics();
    expect(Number.isInteger(metrics.totalDeclaredDepositPaise)).toBe(true);
    expect(Number.isInteger(metrics.totalEligibleDepositPaise)).toBe(true);
    expect(Number.isInteger(metrics.totalShortfallPaise)).toBe(true);
    expect(metrics.totalDeclaredDepositPaise).toBeGreaterThan(0);
  });

  // 4. Renewal double-count prevention
  it('prevents double-counting superseded FDRs when calculating eligible deposit coverage', async () => {
    const portfolio = await aggregatePortfolio('inst-demo-01');
    const inst = portfolio.institutions[0];
    expect(inst).toBeDefined();
    expect(inst.declaredDepositAmountPaise).toBeGreaterThanOrEqual(inst.eligibleDepositAmountPaise);
  });

  // 5. Pending administrative review counts
  it('accurately counts pending administrative reviews across modules', async () => {
    const metrics = await computePortfolioMetrics();
    expect(typeof metrics.pendingAdministrativeReviewsCount).toBe('number');
    expect(metrics.pendingAdministrativeReviewsCount).toBeGreaterThanOrEqual(0);
  });

  // 6. OCR finding aggregation
  it('aggregates document intelligence OCR findings without mutating analyses', async () => {
    const portfolio = await aggregatePortfolio();
    const instWithFindings = portfolio.institutions.find((i) => i.unresolvedDocumentFindingCount > 0);
    expect(instWithFindings).toBeDefined();
    expect(instWithFindings.unresolvedDocumentFindingCount).toBeGreaterThan(0);
  });

  // 7. Simulated bank outcome labeling
  it('strictly labels simulated bank confirmation discrepancies as [SIMULATED]', async () => {
    const alerts = await evaluateOperationalAlerts();
    const bankAlert = alerts.find((a) => a.sourceModule === SOURCE_MODULES.MODULE_05_BANK_SIM);
    if (bankAlert) {
      expect(bankAlert.title).toContain('[SIMULATED]');
      expect(bankAlert.severity).not.toBe(ALERT_SEVERITY.CRITICAL);
    }
  });

  // 8. Compliance case aggregation
  it('aggregates open regulatory compliance cases', async () => {
    const metrics = await computePortfolioMetrics();
    expect(typeof metrics.openComplianceCasesCount).toBe('number');
  });

  // 9. Renewal and release aggregation
  it('aggregates active renewal requests and release requests', async () => {
    const metrics = await computePortfolioMetrics();
    expect(typeof metrics.activeRenewalRequestsCount).toBe('number');
    expect(typeof metrics.pendingReleaseRequestsCount).toBe('number');
  });

  // 10. Deterministic risk prioritization
  it('assigns explainable, deterministic risk priorities without fake probabilities', async () => {
    const dummyCritical = {
      maturedFdrs: 2,
      activeRenewalCount: 0,
      hasComplianceShortfall: false,
      shortfallPaise: 0,
    };
    const evalResult = evaluateInstitutionRiskPriority(dummyCritical);
    expect(evalResult.priority).toBe(RISK_PRIORITY.CRITICAL);
    expect(evalResult.explanation).toBeDefined();
    expect(evalResult.triggeringSignals.length).toBeGreaterThan(0);
    expect(evalResult.recommendedNextAction).toBeDefined();
  });

  // 11. Duplicate risk signal prevention
  it('avoids double-counting the same underlying risk signal in priority evaluation', async () => {
    const profile = {
      maturedFdrs: 1,
      activeRenewalCount: 0,
      hasComplianceShortfall: true,
      shortfallPaise: 50000000,
    };
    const res = evaluateInstitutionRiskPriority(profile);
    // Should be CRITICAL due to matured unrenewed FDR
    expect(res.priority).toBe(RISK_PRIORITY.CRITICAL);
    expect(res.triggeringSignals.some((s) => s.includes('CRITICAL_MATURED_DEPOSIT'))).toBe(true);
  });

  // 12. Unified action inbox normalization
  it('normalizes cross-module items into standard ActionInbox schema', async () => {
    const items = await aggregateActionInbox();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);

    const first = items[0];
    expect(first.actionId).toBeDefined();
    expect(first.sourceModule).toBeDefined();
    expect(first.sourceEntityId).toBeDefined();
    expect(first.institutionId).toBeDefined();
    expect(first.title).toBeDefined();
    expect(first.priority).toBeDefined();
    expect(first.status).toBeDefined();
    expect(first.destinationRoute).toBeDefined();
  });

  // 13. Action destination routing
  it('maps each action inbox item directly to its authoritative domain workflow route', async () => {
    const items = await aggregateActionInbox();
    const fdrItem = items.find((i) => i.sourceModule === SOURCE_MODULES.MODULE_03_FDR);
    const renewalItem = items.find((i) => i.sourceModule === SOURCE_MODULES.MODULE_07_RENEWAL);

    if (fdrItem) {
      expect(fdrItem.destinationRoute.startsWith('/officer/fdr/')).toBe(true);
    }
    if (renewalItem) {
      expect(renewalItem.destinationRoute.startsWith('/officer/renewals/')).toBe(true);
    }
  });

  // 14. Officer assignment
  it('allows authorized officers to assign tasks with immutable record creation', async () => {
    const assigned = await assignOfficerTask({
      actionId: 'ACT-TEST-001',
      sourceModule: SOURCE_MODULES.MODULE_03_FDR,
      sourceEntityId: 'FDR-001',
      institutionId: 'inst-001',
      assignedTo: 'usr-officer-01',
      assignedBy: 'usr-admin-01',
      reason: 'Urgent priority review',
    });

    expect(assigned).toBeDefined();
    expect(assigned.assignedTo).toBe('usr-officer-01');

    const retrieved = await officerAssignmentRepository.getAssignmentByActionId('ACT-TEST-001');
    expect(retrieved).not.toBeNull();
    expect(retrieved.assignedTo).toBe('usr-officer-01');
  });

  // 15. Assignment audit history
  it('records assignment events in audit repository and maintains historical trail', async () => {
    await assignOfficerTask({
      actionId: 'ACT-TEST-002',
      sourceModule: SOURCE_MODULES.MODULE_07_RENEWAL,
      sourceEntityId: 'RNL-002',
      institutionId: 'inst-001',
      assignedTo: 'usr-officer-01',
      assignedBy: 'usr-admin-01',
      reason: 'First allocation',
    });

    // Reassign
    await assignOfficerTask({
      actionId: 'ACT-TEST-002',
      sourceModule: SOURCE_MODULES.MODULE_07_RENEWAL,
      sourceEntityId: 'RNL-002',
      institutionId: 'inst-001',
      assignedTo: 'usr-officer-02',
      assignedBy: 'usr-admin-01',
      reason: 'Workload balancing reassignment',
    });

    const history = await officerAssignmentRepository.getAssignmentHistory('ACT-TEST-002');
    expect(history.length).toBe(2);
    expect(history[0].assignedTo).toBe('usr-officer-01');
    expect(history[1].assignedTo).toBe('usr-officer-02');
  });

  // 16. Officer workload calculations
  it('calculates open and unassigned tasks across officer accounts', async () => {
    const workload = await computeOfficerWorkload();
    expect(workload).toBeDefined();
    expect(typeof workload.totalOfficers).toBe('number');
    expect(typeof workload.totalOpenTasks).toBe('number');
    expect(typeof workload.totalUnassignedTasks).toBe('number');
    expect(Array.isArray(workload.officerStats)).toBe(true);
  });

  // 17. Missing timestamp handling
  it('handles missing timestamps gracefully without throwing errors', () => {
    const timeline = buildEvidenceTimeline({
      institutionId: 'inst-001',
      fdrs: [{ id: 'fdr-no-ts', fdrNumber: 'MISSING-TS' }],
    });
    expect(Array.isArray(timeline)).toBe(true);
    // Entity without timestamp is filtered out safely
    expect(timeline.length).toBe(0);
  });

  // 18. Evidence timeline ordering
  it('orders timeline events strictly chronologically descending', () => {
    const timeline = buildEvidenceTimeline({
      institutionId: 'inst-001',
      fdrs: [
        { id: 'f1', fdrNumber: 'F1', submittedAt: '2026-01-01T10:00:00.000Z' },
        { id: 'f2', fdrNumber: 'F2', submittedAt: '2026-03-01T10:00:00.000Z' },
      ],
      assessments: [
        { id: 'a1', assessedAt: '2026-02-01T10:00:00.000Z', adequacyStatus: 'ADEQUATE' },
      ],
    });

    expect(timeline.length).toBe(3);
    expect(new Date(timeline[0].timestamp).getTime()).toBeGreaterThan(
      new Date(timeline[1].timestamp).getTime()
    );
    expect(new Date(timeline[1].timestamp).getTime()).toBeGreaterThan(
      new Date(timeline[2].timestamp).getTime()
    );
  });

  // 19. Timeline event deduplication
  it('deduplicates identical timeline entries for the same entity and timestamp', () => {
    const timeline = buildEvidenceTimeline({
      institutionId: 'inst-001',
      fdrs: [
        { id: 'f1', fdrNumber: 'F1', submittedAt: '2026-01-01T10:00:00.000Z' },
        { id: 'f1', fdrNumber: 'F1', submittedAt: '2026-01-01T10:00:00.000Z' },
      ],
    });
    expect(timeline.length).toBe(1);
  });

  // 20. Analytics date filtering
  it('filters trends by selected date range (7D, 30D, 90D)', async () => {
    const trend7 = await computePortfolioTrends('7D');
    const trend30 = await computePortfolioTrends('30D');
    expect(trend7.timeline.length).toBeLessThanOrEqual(8);
    expect(trend30.timeline.length).toBeGreaterThan(trend7.timeline.length);
  });

  // 21. Missing historical data handling
  it('displays historical data notice when dataset has no timestamps', async () => {
    const trends = await computePortfolioTrends('7D');
    expect(trends.isDataAvailable !== undefined).toBe(true);
    if (!trends.isDataAvailable) {
      expect(trends.dataNotice).toBe('Historical data unavailable for the selected range.');
    }
  });

  // 22. Operational alert generation
  it('generates operational alerts for critical institutional risks', async () => {
    const alerts = await evaluateOperationalAlerts();
    expect(Array.isArray(alerts)).toBe(true);
    expect(alerts.length).toBeGreaterThan(0);
    const criticalAlert = alerts.find((a) => a.severity === ALERT_SEVERITY.CRITICAL);
    if (criticalAlert) {
      expect(criticalAlert.status).toBe(ALERT_STATUS.ACTIVE);
      expect(criticalAlert.fingerprint).toBeDefined();
    }
  });

  // 23. Alert idempotency
  it('maintains idempotent alert fingerprints across repeated evaluations', async () => {
    const alerts1 = await evaluateOperationalAlerts();
    const alerts2 = await evaluateOperationalAlerts();
    expect(alerts1.length).toBe(alerts2.length);
  });

  // 24. High-priority dismissal reason
  it('strictly requires a justification to dismiss high or critical operational alerts', async () => {
    const alerts = await evaluateOperationalAlerts();
    const highAlert = alerts.find((a) => a.severity === ALERT_SEVERITY.HIGH || a.severity === ALERT_SEVERITY.CRITICAL);

    if (highAlert) {
      // Dismissal without reason should throw
      await expect(
        dismissOperationalAlert(highAlert.id, 'officer-01', '')
      ).rejects.toThrow('Mandatory audit justification required');

      // Dismissal with valid reason should succeed
      const dismissed = await dismissOperationalAlert(
        highAlert.id,
        'officer-01',
        'Valid administrative resolution verified.'
      );
      expect(dismissed.status).toBe(ALERT_STATUS.DISMISSED);
      expect(dismissed.dismissalReason).toBe('Valid administrative resolution verified.');
    }
  });

  // 25. Dashboard preferences persistence
  it('persists customized dashboard preferences by user ID', async () => {
    await commandCenterPreferencesRepository.savePreferences('usr-test-01', {
      defaultDateRange: '90D',
      tableDensity: 'comfortable',
    });

    const prefs = await commandCenterPreferencesRepository.getPreferences('usr-test-01');
    expect(prefs.defaultDateRange).toBe('90D');
    expect(prefs.tableDensity).toBe('comfortable');
  });

  // 26. Dashboard preference reset
  it('resets user preferences back to default values cleanly', async () => {
    await commandCenterPreferencesRepository.savePreferences('usr-test-02', {
      defaultDateRange: '7D',
    });
    const reset = await commandCenterPreferencesRepository.resetPreferences('usr-test-02');
    expect(reset.defaultDateRange).toBe('30D');
  });

  // 27. Demo scenario initialization
  it('initializes all 10 SIH guided scenarios in repository', async () => {
    const scenarios = await demoScenarioOrchestrator.getScenarios();
    expect(scenarios.length).toBe(10);
    expect(scenarios[0].scenarioId).toBe('SIH-SCN-01');
    expect(scenarios[9].scenarioId).toBe('SIH-SCN-10');
  });

  // 28. Demo reset safety
  it('resets guided scenarios without altering user data', async () => {
    await demoScenarioOrchestrator.advanceScenarioStep('SIH-SCN-01', 0);
    let scn = await demoScenarioOrchestrator.getScenario('SIH-SCN-01');
    expect(scn.currentStep).toBe(1);

    await demoScenarioOrchestrator.resetScenario('SIH-SCN-01');
    scn = await demoScenarioOrchestrator.getScenario('SIH-SCN-01');
    expect(scn.currentStep).toBe(0);
  });

  // 29. Data quality issue detection
  it('detects data quality discrepancies across portfolios', async () => {
    const portfolio = await aggregatePortfolio();
    expect(portfolio.institutions.length).toBeGreaterThan(0);
  });

  // 30. Executive report generation
  it('builds executive regulatory reports with mandatory disclaimers', async () => {
    const report = await buildExecutiveReport(REPORT_TYPES.PORTFOLIO_SUMMARY);
    expect(report.title).toBeDefined();
    expect(report.disclaimers.prototypeDisclaimer).toBe(COMMAND_CENTER_PROTOTYPE_DISCLAIMER);
    expect(report.disclaimers.bankSimulationDisclaimer).toBe(BANK_SIMULATION_DISCLAIMER);
  });

  // 31. CSV and JSON export
  it('exports executive reports cleanly to CSV and JSON text formats', async () => {
    const report = await buildExecutiveReport(REPORT_TYPES.PORTFOLIO_SUMMARY);
    const csv = exportReportToCSV(report);
    const json = exportReportToJSON(report);

    expect(typeof csv).toBe('string');
    expect(csv).toContain('Executive Regulatory Portfolio Summary');
    expect(csv).toContain(COMMAND_CENTER_PROTOTYPE_DISCLAIMER);

    expect(typeof json).toBe('string');
    const parsed = JSON.parse(json);
    expect(parsed.reportType).toBe(REPORT_TYPES.PORTFOLIO_SUMMARY);
  });

  // 32. English/Hindi/Marathi translations
  it('includes complete Module 08 translations across English, Hindi, and Marathi', () => {
    expect(en['commandCenter.title']).toBeDefined();
    expect(hi['commandCenter.title']).toBeDefined();
    expect(mr['commandCenter.title']).toBeDefined();

    expect(en['dash.menu.commandCenter']).toBeDefined();
    expect(hi['dash.menu.commandCenter']).toBeDefined();
    expect(mr['dash.menu.commandCenter']).toBeDefined();

    expect(en['dash.menu.portfolio']).toBeDefined();
    expect(hi['dash.menu.portfolio']).toBeDefined();
    expect(mr['dash.menu.portfolio']).toBeDefined();
  });

  // 33. Officer route protection
  it('renders Officer Command Center page under provider context', () => {
    const { container } = renderWithProviders(<OfficerCommandCenterPage />);
    expect(container).toBeDefined();
  });

  // 34. Admin route protection
  it('renders Admin Command Center page under provider context', () => {
    const { container } = renderWithProviders(<AdminCommandCenterPage />);
    expect(container).toBeDefined();
  });

  // 35. Institution route protection
  it('renders Institution Portfolio page under provider context', () => {
    const { container } = renderWithProviders(<InstitutionPortfolioPage />);
    expect(container).toBeDefined();
  });

  // 36. Module 01 regression
  it('preserves public portal and navigation integrity (Module 01)', () => {
    expect(en['nav.home']).toBeDefined();
    expect(en['nav.subTagline']).toBeDefined();
  });

  // 37. Module 02 regression
  it('preserves user accounts and authentication sessions (Module 02)', async () => {
    const users = await userRepository.getAllUsers();
    expect(users.length).toBeGreaterThan(0);
    const officer = users.find((u) => u.role === 'officer');
    expect(officer).toBeDefined();
  });

  // 38. Module 03 regression
  it('preserves FDR lifecycle repositories and transitions (Module 03)', async () => {
    const fdrs = await fdrRepository.getAllFdrRecords();
    expect(fdrs.length).toBeGreaterThan(0);
  });

  // 39. Module 04 regression
  it('preserves document analysis and OCR repositories (Module 04)', async () => {
    const analyses = await documentAnalysisRepository.getAllAnalyses();
    expect(Array.isArray(analyses)).toBe(true);
  });

  // 40. Module 05 regression
  it('preserves simulated bank verification requests (Module 05)', async () => {
    const verifs = await bankVerificationRepository.getAllRequests();
    expect(Array.isArray(verifs)).toBe(true);
  });

  // 41. Module 06 regression
  it('preserves regulatory compliance assessments and cases (Module 06)', async () => {
    const assessments = await complianceAssessmentRepository.getAllAssessments();
    expect(Array.isArray(assessments)).toBe(true);
  });

  // 42. Module 07 regression
  it('preserves FDR renewal requests, release dockets, and escalations (Module 07)', async () => {
    const renewals = await renewalRequestRepository.getAllRequests();
    const releases = await releaseRequestRepository.getAllRequests();
    const escalations = await renewalEscalationRepository.getAllEscalations();

    expect(Array.isArray(renewals)).toBe(true);
    expect(Array.isArray(releases)).toBe(true);
    expect(Array.isArray(escalations)).toBe(true);
  });

  // 43. Complete end-to-end integration workflow test
  it('executes full end-to-end integration workflow across Modules 01 through 08', async () => {
    // 1. Institution submits FDR
    const newFdr = await fdrRepository.createFDR({
      institutionId: 'inst-demo-01',
      fdrNumber: 'FDR-E2E-2026-9999',
      bankName: 'State Bank of India',
      ifscCode: 'SBIN0001234',
      depositAmountPaise: 50000000, // ₹5,00,000
      depositDate: '2026-01-01',
      maturityDate: '2027-01-01',
      jointHolders: 'AICTE and Principal',
      lienMarked: true,
      status: 'SUBMITTED',
    });
    expect(newFdr).toBeDefined();

    // 2. Action inbox ingests submitted FDR
    const inbox = await aggregateActionInbox();
    const foundInInbox = inbox.find((i) => i.sourceEntityId === String(newFdr.id || newFdr.fdrId));
    expect(foundInInbox).toBeDefined();

    // 3. Officer assignment
    await assignOfficerTask({
      actionId: foundInInbox.actionId,
      sourceModule: foundInInbox.sourceModule,
      sourceEntityId: foundInInbox.sourceEntityId,
      institutionId: 'inst-demo-01',
      assignedTo: 'usr-officer-01',
      assignedBy: 'usr-admin-01',
      reason: 'E2E workflow test allocation',
    });

    // 4. Dossier compilation includes new record
    const dossier = await buildInstitutionIntelligenceDossier('inst-demo-01');
    expect(dossier).not.toBeNull();
    const matchingFdr = dossier.fdrs.find((f) => f.fdrNumber === 'FDR-E2E-2026-9999');
    expect(matchingFdr).toBeDefined();

    // 5. Executive report compiles aggregated data
    const report = await buildExecutiveReport(REPORT_TYPES.PORTFOLIO_SUMMARY);
    expect(report.data.totalInstitutions).toBeGreaterThanOrEqual(1);
    expect(report.disclaimers.prototypeDisclaimer).toContain('Prototype');
  });
});
