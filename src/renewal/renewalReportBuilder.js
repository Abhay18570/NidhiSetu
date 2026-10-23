/**
 * NidhiSetu Renewal & Deposit Continuity — Renewal Report Builder
 * Generates audit-ready reports, CSV data, and JSON exports for renewal cycles,
 * deposit continuity statements, and administrative release summaries.
 */

import { RENEWAL_PROTOTYPE_DISCLAIMER } from './renewalModel';

export const renewalReportBuilder = {
  /**
   * Generates a comprehensive Deposit Continuity Statement
   */
  buildContinuityStatement({
    institution,
    originalFdr,
    replacementFdrs = [],
    continuityResult,
    renewalRequest = null,
  }) {
    const generatedAt = new Date().toISOString();

    return {
      reportType: 'DEPOSIT_CONTINUITY_STATEMENT',
      title: 'Administrative Deposit Continuity Statement',
      disclaimer: RENEWAL_PROTOTYPE_DISCLAIMER,
      generatedAt,
      institution: {
        id: institution?.id || originalFdr?.institutionId,
        name: institution?.name || originalFdr?.institutionName || 'Unknown Institution',
      },
      originalCertificate: {
        fdrId: originalFdr?.id || originalFdr?.fdrId,
        fdrNumber: originalFdr?.fdrNumber,
        bankName: originalFdr?.bankName,
        branch: originalFdr?.branchName,
        issueDate: originalFdr?.issueDate,
        maturityDate: originalFdr?.maturityDate,
        amountPaise: originalFdr?.depositAmountPaise || originalFdr?.amountPaise || 0,
        amountRupees: ((originalFdr?.depositAmountPaise || originalFdr?.amountPaise || 0) / 100).toLocaleString('en-IN'),
      },
      replacementCertificates: replacementFdrs.map((r) => ({
        fdrId: r.id || r.fdrId,
        fdrNumber: r.fdrNumber,
        bankName: r.bankName,
        effectiveDate: r.effectiveDate || r.issueDate,
        maturityDate: r.maturityDate,
        amountPaise: r.depositAmountPaise || r.amountPaise || 0,
        amountRupees: ((r.depositAmountPaise || r.amountPaise || 0) / 100).toLocaleString('en-IN'),
      })),
      continuityAssessment: {
        status: continuityResult?.continuityStatus || 'INDETERMINATE',
        requiredPaise: continuityResult?.requiredDepositPaise || 0,
        replacementTotalPaise: continuityResult?.replacementTotalPaise || 0,
        maxShortfallPaise: continuityResult?.maxShortfallPaise || 0,
        uncoveredIntervals: continuityResult?.uncoveredIntervals || [],
        explanation: continuityResult?.explanation || '',
      },
      renewalReference: renewalRequest?.renewalReference || null,
      renewalStatus: renewalRequest?.status || null,
    };
  },

  /**
   * Converts a collection of renewal requests to CSV format
   */
  exportRenewalRequestsToCsv(requests = []) {
    const headers = [
      'Renewal Reference',
      'Original FDR Number',
      'Institution Name',
      'Renewal Type',
      'Old Maturity Date',
      'Proposed Maturity Date',
      'Original Amount (INR)',
      'Replacement Amount (INR)',
      'Continuity Status',
      'Request Status',
      'Submitted At',
    ];

    const rows = requests.map((r) => [
      `"${r.renewalReference || r.renewalRequestId || ''}"`,
      `"${r.originalFdrNumber || r.originalFdrId || ''}"`,
      `"${r.institutionName || r.institutionId || ''}"`,
      `"${r.renewalType || ''}"`,
      `"${r.oldMaturityDate || ''}"`,
      `"${r.proposedMaturityDate || ''}"`,
      ((r.originalAmountPaise || 0) / 100).toFixed(2),
      ((r.replacementTotalPaise || 0) / 100).toFixed(2),
      `"${r.continuityStatus || ''}"`,
      `"${r.status || ''}"`,
      `"${r.submittedAt || ''}"`,
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  },

  /**
   * Converts a collection of administrative release requests to CSV format
   */
  exportReleaseRequestsToCsv(requests = []) {
    const headers = [
      'Release Reference',
      'Original FDR Number',
      'Institution Name',
      'Release Reason',
      'Related Renewal Reference',
      'Status',
      'Cleared Reason / Officer Note',
      'Created At',
    ];

    const rows = requests.map((r) => [
      `"${r.requestReference || r.requestId || ''}"`,
      `"${r.originalFdrNumber || r.originalFdrId || ''}"`,
      `"${r.institutionName || r.institutionId || ''}"`,
      `"${r.releaseReason || ''}"`,
      `"${r.relatedRenewalRequestId || ''}"`,
      `"${r.status || ''}"`,
      `"${r.clearanceReason || (r.officerNotes && r.officerNotes[0]) || ''}"`,
      `"${r.createdAt || ''}"`,
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  },

  /**
   * Triggers a browser download of text data as a file
   */
  downloadFile(content, filename, mimeType = 'text/csv;charset=utf-8;') {
    if (typeof window === 'undefined') return;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
