/**
 * NidhiSetu Command Center — Portfolio Metrics Engine
 * Generates verified, derived operational KPIs across all registered security deposits.
 * Enforces integer-paise accuracy and provides clear source tagging.
 */

import { getDaysUntilMaturity } from '../storage/fdrMaturityService';
import { toPaise } from '../renewal/renewalContinuityEngine';
import { aggregatePortfolio } from './portfolioAggregator';

/**
 * Computes portfolio-wide executive metrics from aggregated portfolio data.
 */
export async function computePortfolioMetrics(aggregatedData = null, referenceDate = new Date()) {
  let data = aggregatedData;
  if (!data) {
    data = await aggregatePortfolio();
  }

  if (!data || !Array.isArray(data.institutions)) {
    return {
      totalRegisteredInstitutions: 0,
      totalInstitutionsCount: 0,
      totalFdrRecords: 0,
      totalFdrsCount: 0,
      totalDeclaredDepositPaise: 0,
      totalEligibleDepositPaise: 0,
      activeFdrRecords: 0,
      activeFdrsCount: 0,
      maturedFdrRecords: 0,
      maturedFdrsCount: 0,
      upcomingMaturityWindows: { critical7: 0, soon30: 0, approaching60: 0, approaching90: 0, matured: 0 },
      maturitySchedule: { '0-7_DAYS': 0, '8-30_DAYS': 0, '31-60_DAYS': 0, '61-90_DAYS': 0, MATURED: 0 },
      pendingAdministrativeReviews: 0,
      pendingAdministrativeReviewsCount: 0,
      unresolvedOcrFindings: 0,
      simulatedBankDiscrepancies: 0,
      declaredDepositShortfallPaise: 0,
      totalShortfallPaise: 0,
      institutionsWithShortfallCount: 0,
      openComplianceCases: 0,
      openComplianceCasesCount: 0,
      activeRenewalRequests: 0,
      activeRenewalRequestsCount: 0,
      pendingAdministrativeReleases: 0,
      pendingReleaseRequestsCount: 0,
      outstandingEscalations: 0,
      unresolvedEscalationsCount: 0,
      metricMetadata: {},
    };
  }

  const { institutions, rawDatasets } = data;
  const allFdrs = rawDatasets?.allFdrs || [];
  const allAnalyses = rawDatasets?.allAnalyses || [];
  const allBankVerifs = rawDatasets?.allBankVerifs || [];
  const allCases = rawDatasets?.allCases || [];
  const allRenewals = rawDatasets?.allRenewals || [];
  const allReleases = rawDatasets?.allReleases || [];
  const allEscalations = rawDatasets?.allEscalations || [];

  // Institutions count
  const totalRegisteredInstitutions = institutions.length;

  // FDRs count
  const totalFdrRecords = allFdrs.length;
  const activeFdrRecords = allFdrs.filter(
    (f) => f.status === 'APPROVED' || f.status === 'ACTIVE' || f.lifecycleStatus === 'APPROVED'
  ).length;

  // Financial Totals in Integer Paise
  const totalDeclaredDepositPaise = allFdrs.reduce(
    (sum, f) => sum + toPaise(f.depositAmountPaise || f.amountPaise),
    0
  );

  const totalEligibleDepositPaise = institutions.reduce(
    (sum, inst) => sum + (inst.eligibleDepositAmountPaise || 0),
    0
  );

  // Maturity Windows
  const maturityWindows = {
    critical7: 0,
    soon30: 0,
    approaching60: 0,
    approaching90: 0,
    matured: 0,
  };

  let maturedFdrCount = 0;

  allFdrs.forEach((fdr) => {
    if (!fdr.maturityDate) return;
    const days = getDaysUntilMaturity(fdr.maturityDate, referenceDate);
    if (days < 0) {
      maturedFdrCount++;
      maturityWindows.matured++;
    } else if (days <= 7) {
      maturityWindows.critical7++;
    } else if (days <= 30) {
      maturityWindows.soon30++;
    } else if (days <= 60) {
      maturityWindows.approaching60++;
    } else if (days <= 90) {
      maturityWindows.approaching90++;
    }
  });

  // Pending Administrative Reviews (Module 03)
  const pendingAdministrativeReviews = allFdrs.filter(
    (f) => f.status === 'SUBMITTED' || f.status === 'UNDER_REVIEW' || f.lifecycleStatus === 'SUBMITTED' || f.lifecycleStatus === 'UNDER_REVIEW'
  ).length;

  // Unresolved OCR Findings (Module 04)
  let unresolvedOcrFindings = 0;
  allAnalyses.forEach((a) => {
    const findings = a.findings || [];
    unresolvedOcrFindings += findings.filter((f) => f.status !== 'RESOLVED' && f.status !== 'DISMISSED').length;
  });

  // Simulated Bank Discrepancies (Module 05)
  const simulatedBankDiscrepancies = allBankVerifs.filter(
    (b) => b.lienMarked === false || b.status === 'RESPONSE_FAILED'
  ).length;

  // Declared Deposit Shortfall Exposure (Module 06)
  const declaredDepositShortfallPaise = institutions.reduce((sum, inst) => {
    return sum + (inst.hasComplianceShortfall ? toPaise(inst.shortfallPaise) : 0);
  }, 0);

  // Open Compliance Cases (Module 06)
  const openComplianceCases = allCases.filter(
    (c) => c.status === 'OPEN' || c.status === 'UNDER_REVIEW' || c.status === 'FOLLOW_UP_REQUESTED'
  ).length;

  // Active Renewal Requests (Module 07)
  const activeRenewalRequests = allRenewals.filter(
    (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW' || r.status === 'CLARIFICATION_REQUIRED' || r.status === 'RESUBMITTED'
  ).length;

  // Pending Administrative Release Requests (Module 07)
  const pendingAdministrativeReleases = allReleases.filter(
    (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW' || r.status === 'CLARIFICATION_REQUIRED'
  ).length;

  // Outstanding Escalations (Module 07)
  const outstandingEscalations = allEscalations.filter((e) => e.status === 'OPEN').length;

  return {
    totalRegisteredInstitutions,
    totalInstitutionsCount: totalRegisteredInstitutions,
    totalFdrRecords,
    totalFdrsCount: totalFdrRecords,
    totalDeclaredDepositPaise,
    totalEligibleDepositPaise,
    activeFdrRecords,
    activeFdrsCount: activeFdrRecords,
    maturedFdrRecords: maturedFdrCount,
    maturedFdrsCount: maturedFdrCount,
    upcomingMaturityWindows: maturityWindows,
    maturitySchedule: {
      '0-7_DAYS': maturityWindows.critical7,
      '8-30_DAYS': maturityWindows.soon30,
      '31-60_DAYS': maturityWindows.approaching60,
      '61-90_DAYS': maturityWindows.approaching90,
      MATURED: maturityWindows.matured,
    },
    pendingAdministrativeReviews,
    pendingAdministrativeReviewsCount: pendingAdministrativeReviews,
    unresolvedOcrFindings,
    simulatedBankDiscrepancies,
    declaredDepositShortfallPaise,
    totalShortfallPaise: declaredDepositShortfallPaise,
    institutionsWithShortfallCount: institutions.filter((i) => i.hasComplianceShortfall).length,
    openComplianceCases,
    openComplianceCasesCount: openComplianceCases,
    activeRenewalRequests,
    activeRenewalRequestsCount: activeRenewalRequests,
    pendingAdministrativeReleases,
    pendingReleaseRequestsCount: pendingAdministrativeReleases,
    outstandingEscalations,
    unresolvedEscalationsCount: outstandingEscalations,
    metricMetadata: {
      calculatedAt: new Date().toISOString(),
      depositCurrency: 'INR',
      accountingPrecision: 'Exact Integer Paise (1 INR = 100 Paise)',
      nonBankingBoundaryNotice: 'Simulated bank signals and administrative record clearance do not represent commercial bank operations.',
    },
  };
}
