/**
 * NidhiSetu Command Center — Unified Portfolio Aggregator
 * Read-only aggregation layer across Modules 02 through 07.
 * Normalizes institutional security deposit footprints without modifying underlying records.
 */

import {
  institutionRepository,
  fdrRepository,
  documentAnalysisRepository,
  bankVerificationRepository,
  complianceAssessmentRepository,
  complianceCaseRepository,
  renewalRequestRepository,
  releaseRequestRepository,
  renewalEscalationRepository,
} from '../storage';
import { toPaise } from '../renewal/renewalContinuityEngine';

/**
 * Aggregates complete regulatory data across all institutions or a single specified institution.
 */
export async function aggregatePortfolio(targetInstitutionId = null) {
  const [
    allInstitutions,
    allFdrs,
    allAnalyses,
    allBankVerifs,
    allAssessments,
    allCases,
    allRenewals,
    allReleases,
    allEscalations,
  ] = await Promise.all([
    institutionRepository.getAllInstitutions(),
    fdrRepository.getAllFdrRecords ? fdrRepository.getAllFdrRecords() : fdrRepository.getAllFDRs(),
    documentAnalysisRepository.getAllAnalyses(),
    bankVerificationRepository.getAllRequests(),
    complianceAssessmentRepository.getAllAssessments(),
    complianceCaseRepository.getAllCases(),
    renewalRequestRepository.getAllRequests(),
    releaseRequestRepository.getAllRequests(),
    renewalEscalationRepository.getAllEscalations(),
  ]);

  const targetInsts = targetInstitutionId
    ? allInstitutions.filter((i) => {
        const id = String(i.id || i.institutionId);
        const target = String(targetInstitutionId);
        return id === target || id.replace('-demo', '') === target.replace('-demo', '');
      })
    : allInstitutions;

  const aggregatedInstitutions = targetInsts.map((inst) => {
    const instId = String(inst.id || inst.institutionId);

    // Associated FDRs
    const instFdrs = allFdrs.filter((f) => {
      const fId = String(f.institutionId);
      return fId === instId || fId.replace('-demo', '') === instId.replace('-demo', '');
    });
    const activeFdrs = instFdrs.filter((f) => f.status === 'APPROVED' || f.status === 'ACTIVE' || f.lifecycleStatus === 'APPROVED');
    const maturedFdrs = instFdrs.filter((f) => {
      if (!f.maturityDate) return false;
      return new Date(f.maturityDate) < new Date();
    });

    // Associated Document Intelligence Analyses
    const instFdrIds = new Set(instFdrs.map((f) => String(f.id || f.fdrId)));
    const instAnalyses = allAnalyses.filter((a) => {
      const aId = String(a.institutionId || '');
      return instFdrIds.has(String(a.fdrId)) || aId === instId || aId.replace('-demo', '') === instId.replace('-demo', '');
    });
    const unresolvedDocFindings = instAnalyses.reduce((count, a) => {
      const findings = a.findings || [];
      return count + findings.filter((f) => f.status !== 'RESOLVED' && f.status !== 'DISMISSED').length;
    }, 0);

    // Associated Simulated Bank Verifications
    const instBankVerifs = allBankVerifs.filter((b) => instFdrIds.has(String(b.fdrId)));
    const simulatedBankDiscrepancies = instBankVerifs.filter(
      (b) => b.lienMarked === false || b.status === 'RESPONSE_FAILED'
    ).length;

    // Associated Compliance Assessments (Module 06)
    const instAssessments = allAssessments
      .filter((a) => {
        const aId = String(a.institutionId);
        return aId === instId || aId.replace('-demo', '') === instId.replace('-demo', '');
      })
      .sort((a, b) => new Date(b.assessedAt || b.createdAt) - new Date(a.assessedAt || a.createdAt));
    const latestAssessment = instAssessments[0] || null;

    // Associated Compliance Cases (Module 06)
    const instCases = allCases.filter((c) => {
      const cId = String(c.institutionId);
      return cId === instId || cId.replace('-demo', '') === instId.replace('-demo', '');
    });
    const openCases = instCases.filter(
      (c) => c.status === 'OPEN' || c.status === 'UNDER_REVIEW' || c.status === 'FOLLOW_UP_REQUESTED'
    );

    // Associated Renewal Requests (Module 07)
    const instRenewals = allRenewals.filter((r) => {
      const rId = String(r.institutionId);
      return rId === instId || rId.replace('-demo', '') === instId.replace('-demo', '');
    });
    const activeRenewals = instRenewals.filter(
      (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW' || r.status === 'CLARIFICATION_REQUIRED' || r.status === 'RESUBMITTED'
    );

    // Associated Administrative Release Requests (Module 07)
    const instReleases = allReleases.filter((r) => {
      const rId = String(r.institutionId);
      return rId === instId || rId.replace('-demo', '') === instId.replace('-demo', '');
    });
    const activeReleases = instReleases.filter(
      (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW' || r.status === 'CLARIFICATION_REQUIRED'
    );

    // Associated Escalations (Module 07)
    const instEscalations = allEscalations.filter((e) => {
      const eId = String(e.institutionId);
      return eId === instId || eId.replace('-demo', '') === instId.replace('-demo', '');
    });
    const openEscalations = instEscalations.filter((e) => e.status === 'OPEN');

    // Total Declared Principal (in integer paise)
    const declaredDepositAmountPaise = instFdrs.reduce(
      (sum, f) => sum + toPaise(f.depositAmountPaise || f.amountPaise),
      0
    );

    // Avoid double counting superseded certificates when calculating eligible deposit coverage
    const supersededFdrIds = new Set();
    instRenewals.forEach((r) => {
      if (r.status === 'ACCEPTED_FOR_RECORD') {
        supersededFdrIds.add(String(r.originalFdrId));
      }
    });

    const eligibleDepositAmountPaise = instFdrs
      .filter((f) => !supersededFdrIds.has(String(f.id || f.fdrId)) && f.status !== 'CANCELLED' && f.status !== 'REJECTED')
      .reduce((sum, f) => sum + toPaise(f.depositAmountPaise || f.amountPaise), 0);

    return {
      institutionId: instId,
      institutionName: inst.name || `Institution #${instId}`,
      category: inst.category || 'TECHNICAL_COLLEGE',
      state: inst.state || 'Maharashtra',
      district: inst.district || 'Pune',
      totalFdrs: instFdrs.length,
      activeFdrs: activeFdrs.length,
      maturedFdrs: maturedFdrs.length,
      declaredDepositAmountPaise,
      eligibleDepositAmountPaise,
      latestComplianceAssessment: latestAssessment,
      hasComplianceShortfall: latestAssessment ? latestAssessment.shortfallPaise > 0 : false,
      shortfallPaise: latestAssessment ? latestAssessment.shortfallPaise : 0,
      unresolvedDocumentFindingCount: unresolvedDocFindings,
      simulatedBankFindingCount: simulatedBankDiscrepancies,
      openComplianceCaseCount: openCases.length,
      activeRenewalCount: activeRenewals.length,
      activeReleaseRequestCount: activeReleases.length,
      unresolvedEscalationCount: openEscalations.length,
      latestActivityAt: inst.updatedAt || inst.createdAt || new Date().toISOString(),
      rawEntities: {
        fdrs: instFdrs,
        assessments: instAssessments,
        cases: instCases,
        renewals: instRenewals,
        releases: instReleases,
        escalations: instEscalations,
      },
    };
  });

  return {
    institutions: aggregatedInstitutions,
    totalInstitutionsCount: aggregatedInstitutions.length,
    rawDatasets: {
      allFdrs,
      allAnalyses,
      allBankVerifs,
      allAssessments,
      allCases,
      allRenewals,
      allReleases,
      allEscalations,
    },
    aggregatedAt: new Date().toISOString(),
  };
}

/**
 * Aggregates portfolio intelligence for a single institution
 */
export async function aggregateInstitutionPortfolio(institutionId) {
  const result = await aggregatePortfolio(institutionId);
  return result.institutions.length > 0 ? result.institutions[0] : null;
}
