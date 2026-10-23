/**
 * NidhiSetu Command Center — Executive Report Builder
 * Generates structured executive summaries and data exports in JSON and CSV formats.
 *
 * CRITICAL REGULATORY SAFEGUARD:
 * Every report generated strictly embeds:
 * 1. "NidhiSetu Prototype Analytics — Not an Official Regulatory Determination"
 * 2. "Bank Confirmation Data Is Simulated — No Real Bank Verification Performed"
 * Does not emit official regulatory certificates.
 */

import {
  REPORT_TYPES,
  COMMAND_CENTER_PROTOTYPE_DISCLAIMER,
  BANK_SIMULATION_DISCLAIMER,
} from './commandCenterModel';
import { aggregatePortfolio } from './portfolioAggregator';
import { computePortfolioMetrics } from './portfolioMetricsEngine';
import { computeOfficerWorkload } from './officerWorkloadEngine';

/**
 * Builds a structured executive report object.
 */
export async function buildExecutiveReport(reportType = REPORT_TYPES.PORTFOLIO_SUMMARY, options = {}) {
  const [portfolio, metrics, workload] = await Promise.all([
    aggregatePortfolio(options.institutionId || null),
    computePortfolioMetrics(),
    computeOfficerWorkload(),
  ]);

  const timestamp = new Date().toISOString();
  let title = 'Executive Regulatory Portfolio Summary';
  let reportData = {};

  switch (reportType) {
    case REPORT_TYPES.INSTITUTION_INTELLIGENCE:
      title = 'Institutional Intelligence Dossier Summary';
      reportData = {
        institutions: portfolio.institutions,
      };
      break;

    case REPORT_TYPES.OFFICER_WORKLOAD:
      title = 'Officer Workload & Scrutiny Allocation Report';
      reportData = {
        totalOfficers: workload.totalOfficers,
        totalOpenTasks: workload.totalOpenTasks,
        totalUnassignedTasks: workload.totalUnassignedTasks,
        officers: workload.officerStats,
      };
      break;

    case REPORT_TYPES.MATURITY_EXPOSURE:
      title = 'Security Deposit Maturity Exposure Schedule';
      reportData = {
        maturitySchedule: metrics.maturitySchedule,
        totalMatured: metrics.maturedFdrsCount,
        upcomingWithin30Days: metrics.maturitySchedule['8-30_DAYS'],
      };
      break;

    case REPORT_TYPES.COMPLIANCE_ATTENTION:
      title = 'Regulatory Compliance & Adequacy Attention Report';
      reportData = {
        institutionsWithShortfall: metrics.institutionsWithShortfallCount,
        totalShortfallRupees: metrics.totalShortfallPaise / 100,
        openComplianceCases: metrics.openComplianceCasesCount,
        shortfallInstitutions: portfolio.institutions.filter((i) => i.hasComplianceShortfall),
      };
      break;

    case REPORT_TYPES.RENEWAL_OPERATIONS:
      title = 'FDR Renewal & Deposit Continuity Operations Report';
      reportData = {
        activeRenewalRequests: metrics.activeRenewalRequestsCount,
        pendingReleaseRequests: metrics.pendingReleaseRequestsCount,
        unresolvedEscalations: metrics.unresolvedEscalationsCount,
      };
      break;

    case REPORT_TYPES.PORTFOLIO_SUMMARY:
    default:
      title = 'Executive Regulatory Portfolio Summary';
      reportData = {
        kpis: metrics,
        totalInstitutions: portfolio.totalInstitutionsCount,
        summaryByInstitution: portfolio.institutions.map((i) => ({
          id: i.institutionId,
          name: i.institutionName,
          totalFdrs: i.totalFdrs,
          declaredDepositRupees: i.declaredDepositAmountPaise / 100,
          eligibleDepositRupees: i.eligibleDepositAmountPaise / 100,
          shortfallRupees: (i.shortfallPaise || 0) / 100,
          activeRenewals: i.activeRenewalCount,
          openCases: i.openComplianceCaseCount,
        })),
      };
      break;
  }

  return {
    reportType,
    title,
    generatedAt: timestamp,
    reportingPeriod: options.reportingPeriod || 'Current Active Period (Rolling 30 Days)',
    dataScope: options.institutionId ? `Institution ID: ${options.institutionId}` : 'All Registered Institutions',
    disclaimers: {
      prototypeDisclaimer: COMMAND_CENTER_PROTOTYPE_DISCLAIMER,
      bankSimulationDisclaimer: BANK_SIMULATION_DISCLAIMER,
      governanceNotice: 'Derived from local simulation repositories. For demonstration and hackathon review only.',
    },
    data: reportData,
  };
}

/**
 * Converts report summary data into CSV formatted text.
 */
export function exportReportToCSV(report) {
  if (!report || !report.data) return '';

  const rows = [];
  rows.push([`"${report.title}"`]);
  rows.push([`"Generated At"`, `"${report.generatedAt}"`]);
  rows.push([`"Disclaimer"`, `"${report.disclaimers.prototypeDisclaimer}"`]);
  rows.push([`"Banking Disclaimer"`, `"${report.disclaimers.bankSimulationDisclaimer}"`]);
  rows.push([]);

  // Flatten tabular data if present
  if (report.data.summaryByInstitution) {
    rows.push([
      '"Institution ID"',
      '"Institution Name"',
      '"Total FDRs"',
      '"Declared Principal (INR)"',
      '"Eligible Principal (INR)"',
      '"Shortfall (INR)"',
      '"Active Renewals"',
      '"Open Cases"',
    ]);

    report.data.summaryByInstitution.forEach((inst) => {
      rows.push([
        `"${inst.id}"`,
        `"${inst.name.replace(/"/g, '""')}"`,
        inst.totalFdrs,
        inst.declaredDepositRupees,
        inst.eligibleDepositRupees,
        inst.shortfallRupees,
        inst.activeRenewals,
        inst.openCases,
      ]);
    });
  } else if (report.data.officers) {
    rows.push(['"Officer ID"', '"Officer Name"', '"Email"', '"Role"', '"Open Tasks"', '"High Priority"', '"Overdue"']);
    report.data.officers.forEach((off) => {
      rows.push([
        `"${off.officerId}"`,
        `"${off.officerName}"`,
        `"${off.officerEmail}"`,
        `"${off.role}"`,
        off.openTasksCount,
        off.highPriorityTasksCount,
        off.overdueTasksCount,
      ]);
    });
  } else {
    rows.push(['"Key"', '"Value"']);
    Object.entries(report.data).forEach(([k, v]) => {
      if (typeof v !== 'object') {
        rows.push([`"${k}"`, `"${v}"`]);
      }
    });
  }

  return rows.map((r) => r.join(',')).join('\n');
}

/**
 * Exports report as formatted JSON string.
 */
export function exportReportToJSON(report) {
  return JSON.stringify(report, null, 2);
}
