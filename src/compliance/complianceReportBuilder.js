/**
 * NidhiSetu Compliance Report Builder
 * Generates structured, print-friendly, JSON, and CSV compliance assessment reports.
 *
 * All reports include strict prototype and bank simulation disclaimers.
 * Never fabricates official signatures or government approval seals.
 */

import { PROTOTYPE_COMPLIANCE_DISCLAIMER, SIMULATED_BANK_DISCLAIMER } from './complianceDemoFixtures';

export const REPORT_TYPES = {
  INSTITUTION_SUMMARY: 'INSTITUTION_SUMMARY',
  ADEQUACY_STATEMENT: 'ADEQUACY_STATEMENT',
  MATURITY_REPORT: 'MATURITY_REPORT',
  OFFICER_CASE_REPORT: 'OFFICER_CASE_REPORT',
  PORTFOLIO_OVERVIEW: 'PORTFOLIO_OVERVIEW',
};

/**
 * Builds a structured report payload from an assessment snapshot.
 */
export function buildReportPayload(assessment, reportType = REPORT_TYPES.INSTITUTION_SUMMARY, metadata = {}) {
  const generatedAt = new Date().toISOString();

  return {
    reportId: `REP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    reportType,
    title: getReportTitle(reportType),
    generatedAt,
    generatedBy: metadata.officerName || 'Regulatory Compliance Officer (Simulation)',
    disclaimer: PROTOTYPE_COMPLIANCE_DISCLAIMER,
    simulatedBankDisclaimer: SIMULATED_BANK_DISCLAIMER,
    assessmentSnapshot: assessment,
  };
}

function getReportTitle(type) {
  switch (type) {
    case REPORT_TYPES.ADEQUACY_STATEMENT:
      return 'FDR Security Deposit Adequacy Statement';
    case REPORT_TYPES.MATURITY_REPORT:
      return 'Maturity Schedule & Renewal Risk Report';
    case REPORT_TYPES.OFFICER_CASE_REPORT:
      return 'Officer Compliance Review & Case Adjudication Record';
    case REPORT_TYPES.PORTFOLIO_OVERVIEW:
      return 'Institutional Portfolio Compliance Monitoring Digest';
    case REPORT_TYPES.INSTITUTION_SUMMARY:
    default:
      return 'Regulatory Compliance Intelligence Assessment Report';
  }
}

/**
 * Generates CSV string for deposit adequacy and risk findings
 */
export function generateAssessmentCsv(assessment) {
  if (!assessment) return '';

  const rows = [
    ['NidhiSetu Regulatory Compliance Assessment Report (Prototype)'],
    ['Disclaimer', PROTOTYPE_COMPLIANCE_DISCLAIMER],
    ['Bank Disclaimer', SIMULATED_BANK_DISCLAIMER],
    [],
    ['Institution Name', assessment.institutionName || 'N/A'],
    ['Institution ID', assessment.institutionId || 'N/A'],
    ['Assessment Date', assessment.assessmentDate || 'N/A'],
    ['Applicable Rule Code', assessment.ruleCode || 'NONE'],
    ['Applicable Rule Version', assessment.ruleVersion || 'N/A'],
    ['Adequacy Status', assessment.adequacyStatus || 'N/A'],
    ['Required Deposit (INR)', (assessment.requiredAmountPaise / 100).toFixed(2)],
    ['Eligible Declared Deposit (INR)', (assessment.eligibleDeclaredAmountPaise / 100).toFixed(2)],
    ['Shortfall (INR)', (assessment.shortfallPaise / 100).toFixed(2)],
    ['Surplus (INR)', (assessment.surplusPaise / 100).toFixed(2)],
    ['Coverage Percentage', `${assessment.coveragePercentage}%`],
    ['Overall Review Priority', assessment.overallPriority || 'N/A'],
    [],
    ['--- ELIGIBLE DEPOSITS ---'],
    ['FDR ID', 'FDR Number', 'Bank Name', 'Amount (INR)', 'Maturity Date'],
    ...(assessment.eligibleDeposits || []).map((d) => [
      d.fdrId,
      d.fdrNumber || 'N/A',
      d.bankName || 'N/A',
      ((d.amountPaise || 0) / 100).toFixed(2),
      d.maturityDate || 'N/A',
    ]),
    [],
    ['--- EXCLUDED DEPOSITS ---'],
    ['FDR ID', 'FDR Number', 'Amount (INR)', 'Exclusion Reason', 'Explanation'],
    ...(assessment.excludedDeposits || []).map((e) => [
      e.fdrId,
      e.fdrNumber || 'N/A',
      ((e.amountPaise || 0) / 100).toFixed(2),
      e.reason || 'N/A',
      `"${(e.explanation || '').replace(/"/g, '""')}"`,
    ]),
    [],
    ['--- RISK INDICATORS ---'],
    ['Signal ID', 'Category', 'Severity', 'Explanation', 'Recommended Action'],
    ...(assessment.riskAnalysis?.indicators || []).map((ind) => [
      ind.signalId,
      ind.category,
      ind.severity,
      `"${(ind.explanation || '').replace(/"/g, '""')}"`,
      `"${(ind.recommendedAction || '').replace(/"/g, '""')}"`,
    ]),
  ];

  return rows.map((r) => r.join(',')).join('\n');
}

/**
 * Downloads assessment data as JSON file
 */
export function exportAssessmentAsJson(assessment) {
  const jsonStr = JSON.stringify(assessment, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NidhiSetu-Compliance-${assessment.institutionId || 'export'}-${assessment.assessmentDate || 'date'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Downloads assessment data as CSV file
 */
export function exportAssessmentAsCsv(assessment) {
  const csvContent = generateAssessmentCsv(assessment);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NidhiSetu-Compliance-${assessment.institutionId || 'export'}-${assessment.assessmentDate || 'date'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
