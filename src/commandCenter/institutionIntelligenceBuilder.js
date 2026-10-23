/**
 * NidhiSetu Command Center — Institution Intelligence Builder
 * Constructs a 360-degree regulatory intelligence dossier for an institution.
 * Combines data across Modules 02 through 07 with strict ownership boundaries.
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
import { evaluateInstitutionRiskPriority } from './riskPriorityEngine';
import { buildEvidenceTimeline } from './evidenceTimelineBuilder';
import { toPaise } from '../renewal/renewalContinuityEngine';

/**
 * Builds the comprehensive intelligence dossier for a target institution.
 *
 * @param {string} institutionId
 * @returns {Promise<Object|null>} Institution Intelligence Dossier
 */
export async function buildInstitutionIntelligenceDossier(institutionId) {
  if (!institutionId) return null;

  const targetInstId = String(institutionId);

  const [
    instFound,
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
    institutionRepository.getInstitutionById(targetInstId),
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

  const inst =
    instFound ||
    allInstitutions.find(
      (i) =>
        String(i.id) === targetInstId ||
        String(i.id).replace('-demo', '') === targetInstId.replace('-demo', '')
    ) ||
    null;

  if (!inst) {
    return null;
  }

  // Filter entities specifically belonging to this institution
  const instIdCandidates = new Set([
    targetInstId,
    targetInstId.replace('-demo', ''),
    String(inst.id),
  ]);
  const instFdrs = allFdrs.filter(
    (f) =>
      instIdCandidates.has(String(f.institutionId)) ||
      (f.institutionId && String(f.institutionId).replace('-demo', '') === targetInstId.replace('-demo', ''))
  );
  const fdrIds = new Set(instFdrs.map((f) => String(f.id || f.fdrId)));

  const instAnalyses = allAnalyses.filter((a) => fdrIds.has(String(a.fdrId)));
  const instBankVerifs = allBankVerifs.filter((b) => fdrIds.has(String(b.fdrId)));
  const instAssessments = allAssessments
    .filter((a) => String(a.institutionId) === targetInstId)
    .sort((a, b) => new Date(b.assessedAt || b.createdAt) - new Date(a.assessedAt || a.createdAt));
  const instCases = allCases.filter((c) => String(c.institutionId) === targetInstId);
  const instRenewals = allRenewals.filter((r) => String(r.institutionId) === targetInstId);
  const instReleases = allReleases.filter((r) => String(r.institutionId) === targetInstId);
  const instEscalations = allEscalations.filter((e) => String(e.institutionId) === targetInstId);

  // Financial calculations
  const declaredDepositAmountPaise = instFdrs.reduce(
    (sum, f) => sum + toPaise(f.depositAmountPaise || f.amountPaise),
    0
  );

  const activeRenewals = instRenewals.filter((r) =>
    ['SUBMITTED', 'UNDER_REVIEW', 'CLARIFICATION_REQUIRED', 'RESUBMITTED'].includes(r.status)
  );

  // Superseded FDR tracking to prevent double-counting
  const supersededFdrIds = new Set();
  instRenewals.forEach((r) => {
    if (r.status === 'ACCEPTED_FOR_RECORD') {
      supersededFdrIds.add(String(r.originalFdrId));
    }
  });

  const eligibleFdrs = instFdrs.filter(
    (f) => !supersededFdrIds.has(String(f.id || f.fdrId)) && f.status !== 'CANCELLED' && f.status !== 'REJECTED'
  );

  const eligibleDepositAmountPaise = eligibleFdrs.reduce(
    (sum, f) => sum + toPaise(f.depositAmountPaise || f.amountPaise),
    0
  );

  // Maturity classification
  const now = new Date();
  const maturedFdrs = instFdrs.filter((f) => f.maturityDate && new Date(f.maturityDate) < now);
  const activeFdrs = instFdrs.filter((f) => ['APPROVED', 'ACTIVE'].includes(f.status || f.lifecycleStatus));

  // Risk evaluation profile
  const profileForRisk = {
    institutionId: targetInstId,
    institutionName: inst.name,
    totalFdrs: instFdrs.length,
    activeFdrs: activeFdrs.length,
    maturedFdrs: maturedFdrs.length,
    declaredDepositAmountPaise,
    eligibleDepositAmountPaise,
    latestComplianceAssessment: instAssessments[0] || null,
    hasComplianceShortfall: instAssessments[0] ? instAssessments[0].shortfallPaise > 0 : false,
    shortfallPaise: instAssessments[0] ? instAssessments[0].shortfallPaise : 0,
    unresolvedDocumentFindingCount: instAnalyses.reduce((c, a) => c + (a.findings || []).filter(f => f.status !== 'RESOLVED' && f.status !== 'DISMISSED').length, 0),
    simulatedBankFindingCount: instBankVerifs.filter(b => b.lienMarked === false || b.status === 'RESPONSE_FAILED').length,
    openComplianceCaseCount: instCases.filter(c => ['OPEN', 'UNDER_REVIEW'].includes(c.status)).length,
    activeRenewalCount: activeRenewals.length,
    activeReleaseRequestCount: instReleases.filter(r => ['SUBMITTED', 'UNDER_REVIEW'].includes(r.status)).length,
    unresolvedEscalationCount: instEscalations.filter(e => e.status === 'OPEN').length,
  };

  const riskEvaluation = evaluateInstitutionRiskPriority(profileForRisk);

  // Build Chronological Evidence Timeline
  const evidenceTimeline = buildEvidenceTimeline({
    institutionId: targetInstId,
    fdrs: instFdrs,
    analyses: instAnalyses,
    bankVerifications: instBankVerifs,
    assessments: instAssessments,
    cases: instCases,
    renewals: instRenewals,
    releases: instReleases,
    escalations: instEscalations,
  });

  return {
    institution: {
      id: targetInstId,
      name: inst.name,
      registrationNumber: inst.registrationNumber || inst.aisheCode || `INST-${targetInstId}`,
      category: inst.category || 'TECHNICAL_COLLEGE',
      state: inst.state || 'Maharashtra',
      district: inst.district || 'Pune',
      contactEmail: inst.email || inst.contactEmail || 'office@institution.ac.in',
      phone: inst.phone || '+91 20 2550 7000',
      address: inst.address || 'Wellesley Rd, Shivajinagar, Pune',
      status: inst.status || 'ACTIVE',
      createdAt: inst.createdAt || '2025-01-01T00:00:00.000Z',
    },
    riskPriority: riskEvaluation,
    portfolioSummary: {
      totalFdrs: instFdrs.length,
      activeFdrs: activeFdrs.length,
      maturedFdrs: maturedFdrs.length,
      declaredDepositAmountPaise,
      eligibleDepositAmountPaise,
      supersededCount: supersededFdrIds.size,
      hasShortfall: profileForRisk.hasComplianceShortfall,
      shortfallPaise: profileForRisk.shortfallPaise,
    },
    fdrs: instFdrs.map((f) => ({
      ...f,
      destinationRoute: `/officer/fdr/${f.id || f.fdrId}`,
      isSuperseded: supersededFdrIds.has(String(f.id || f.fdrId)),
    })),
    documentFindings: instAnalyses.flatMap((a) =>
      (a.findings || []).map((f) => ({
        ...f,
        fdrId: a.fdrId,
        analysisId: a.id,
        analyzedAt: a.analyzedAt,
        destinationRoute: '/officer/document-intelligence',
      }))
    ),
    bankVerifications: instBankVerifs.map((b) => ({
      ...b,
      destinationRoute: `/officer/bank-verifications/${b.id || b.requestId}`,
      isSimulated: true,
      simulationNotice: 'Simulated Bank Environment — Mock SFMS/CBS Output',
    })),
    complianceAssessments: instAssessments.map((a) => ({
      ...a,
      destinationRoute: `/officer/compliance/${targetInstId}`,
    })),
    cases: instCases.map((c) => ({
      ...c,
      destinationRoute: `/officer/compliance-cases/${c.id || c.caseId}`,
    })),
    renewals: instRenewals.map((r) => ({
      ...r,
      destinationRoute: `/officer/renewals/${r.id || r.requestId}`,
    })),
    releaseRequests: instReleases.map((rel) => ({
      ...rel,
      destinationRoute: `/officer/release-requests/${rel.id || rel.requestId}`,
    })),
    escalations: instEscalations.map((e) => ({
      ...e,
      destinationRoute: '/admin/renewal-monitoring',
    })),
    evidenceTimeline,
    dossierGeneratedAt: new Date().toISOString(),
  };
}
