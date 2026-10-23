/**
 * NidhiSetu Command Center — Analytics & Trend Engine
 * Computes deterministic historical trends and portfolio distribution curves derived from actual timestamps.
 *
 * CRITICAL REQUIREMENTS:
 * - Derives trends strictly from recorded timestamps across Modules 03 through 07.
 * - Does not invent historical portfolio figures.
 * - Explicitly flags datasets with "Historical data unavailable" when timestamp records do not exist.
 */

import {
  fdrRepository,
  documentAnalysisRepository,
  bankVerificationRepository,
  complianceAssessmentRepository,
  complianceCaseRepository,
  renewalRequestRepository,
  releaseRequestRepository,
} from '../storage';

/**
 * Computes event distribution trends over a specified period.
 *
 * @param {'7D'|'30D'|'90D'|'ALL'} dateRange
 * @returns {Promise<Object>} Computed trend timelines and distribution bins
 */
export async function computePortfolioTrends(dateRange = '30D') {
  const [
    allFdrs,
    allAnalyses,
    allBankVerifs,
    allAssessments,
    allCases,
    allRenewals,
    allReleases,
  ] = await Promise.all([
    fdrRepository.getAllFdrRecords ? fdrRepository.getAllFdrRecords() : fdrRepository.getAllFDRs(),
    documentAnalysisRepository.getAllAnalyses(),
    bankVerificationRepository.getAllRequests(),
    complianceAssessmentRepository.getAllAssessments(),
    complianceCaseRepository.getAllCases(),
    renewalRequestRepository.getAllRequests(),
    releaseRequestRepository.getAllRequests(),
  ]);

  const now = new Date();
  let daysBack = 30;
  if (dateRange === '7D') daysBack = 7;
  else if (dateRange === '90D') daysBack = 90;
  else if (dateRange === 'ALL') daysBack = 365;

  const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

  // Group events by day bucket (YYYY-MM-DD)
  const buckets = new Map();
  for (let i = 0; i <= daysBack; i++) {
    const d = new Date(cutoff.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split('T')[0];
    buckets.set(key, {
      date: key,
      submissions: 0,
      reviewsCompleted: 0,
      renewalsSubmitted: 0,
      releasesRequested: 0,
      simulatedBankResponses: 0,
      complianceAssessments: 0,
    });
  }

  function incrementBucket(dateStr, field) {
    if (!dateStr) return;
    const key = String(dateStr).split('T')[0];
    if (buckets.has(key)) {
      buckets.get(key)[field]++;
    }
  }

  allFdrs.forEach((f) => {
    incrementBucket(f.submittedAt || f.createdAt, 'submissions');
    if (f.reviewedAt) incrementBucket(f.reviewedAt, 'reviewsCompleted');
  });

  allRenewals.forEach((r) => {
    incrementBucket(r.submittedAt || r.createdAt, 'renewalsSubmitted');
    if (r.reviewedAt) incrementBucket(r.reviewedAt, 'reviewsCompleted');
  });

  allReleases.forEach((rel) => {
    incrementBucket(rel.submittedAt || rel.createdAt, 'releasesRequested');
  });

  allBankVerifs.forEach((b) => {
    if (b.respondedAt) incrementBucket(b.respondedAt, 'simulatedBankResponses');
  });

  allAssessments.forEach((a) => {
    incrementBucket(a.assessedAt || a.createdAt, 'complianceAssessments');
  });

  const timeline = Array.from(buckets.values());

  // Aggregate totals
  const totalSubmissions = timeline.reduce((s, b) => s + b.submissions, 0);
  const totalReviews = timeline.reduce((s, b) => s + b.reviewsCompleted, 0);
  const totalRenewals = timeline.reduce((s, b) => s + b.renewalsSubmitted, 0);
  const totalReleases = timeline.reduce((s, b) => s + b.releasesRequested, 0);
  const totalSimulatedResponses = timeline.reduce((s, b) => s + b.simulatedBankResponses, 0);

  // Distribution breakdowns
  const fdrStatusDistribution = {};
  allFdrs.forEach((f) => {
    const s = f.status || f.lifecycleStatus || 'UNKNOWN';
    fdrStatusDistribution[s] = (fdrStatusDistribution[s] || 0) + 1;
  });

  const renewalStatusDistribution = {};
  allRenewals.forEach((r) => {
    const s = r.status || 'UNKNOWN';
    renewalStatusDistribution[s] = (renewalStatusDistribution[s] || 0) + 1;
  });

  const simulatedBankOutcomes = {
    CONFIRMED_LIEN: allBankVerifs.filter((b) => b.lienMarked === true).length,
    UNCONFIRMED_LIEN: allBankVerifs.filter((b) => b.lienMarked === false).length,
    FAILED_RESPONSE: allBankVerifs.filter((b) => b.status === 'RESPONSE_FAILED').length,
    PENDING_RESPONSE: allBankVerifs.filter((b) => b.status === 'SENT' || b.status === 'QUEUED').length,
  };

  const hasActivity = totalSubmissions + totalReviews + totalRenewals + totalReleases + totalSimulatedResponses > 0;

  return {
    dateRange,
    daysBack,
    timeline,
    totals: {
      submissions: totalSubmissions,
      reviewsCompleted: totalReviews,
      renewalsSubmitted: totalRenewals,
      releasesRequested: totalReleases,
      simulatedBankResponses: totalSimulatedResponses,
    },
    distributions: {
      fdrStatuses: fdrStatusDistribution,
      renewalStatuses: renewalStatusDistribution,
      simulatedBankOutcomes,
    },
    isDataAvailable: hasActivity,
    dataNotice: hasActivity ? null : 'Historical data unavailable for the selected range.',
    generatedAt: new Date().toISOString(),
  };
}
