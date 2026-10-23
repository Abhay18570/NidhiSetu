/**
 * NidhiSetu Command Center — Unified Case & Action Inbox Aggregator
 * Consolidates actionable tasks across Modules 03 through 07 into a single, normalized scrutiny inbox.
 *
 * CRITICAL ARCHITECTURAL BOUNDARY:
 * This is an aggregation and routing inbox. It does NOT implement an independent second approval engine.
 * Clicking any task routes the officer directly to the authoritative domain workflow.
 */

import {
  fdrRepository,
  documentAnalysisRepository,
  bankVerificationRepository,
  complianceCaseRepository,
  renewalRequestRepository,
  releaseRequestRepository,
  renewalEscalationRepository,
} from '../storage';
import { SOURCE_MODULES, RISK_PRIORITY } from './commandCenterModel';

/**
 * Aggregates all actionable items across Modules 03–07.
 */
export async function aggregateActionInbox(filterOfficerId = null) {
  const [
    allFdrs,
    allAnalyses,
    allBankVerifs,
    allCases,
    allRenewals,
    allReleases,
    allEscalations,
  ] = await Promise.all([
    fdrRepository.getAllFdrRecords ? fdrRepository.getAllFdrRecords() : fdrRepository.getAllFDRs(),
    documentAnalysisRepository.getAllAnalyses(),
    bankVerificationRepository.getAllRequests(),
    complianceCaseRepository.getAllCases(),
    renewalRequestRepository.getAllRequests(),
    releaseRequestRepository.getAllRequests(),
    renewalEscalationRepository.getAllEscalations(),
  ]);

  const items = [];

  // 1. Module 03: FDR Administrative Scrutiny Queue
  allFdrs.forEach((fdr) => {
    const status = fdr.status || fdr.lifecycleStatus;
    if (status === 'SUBMITTED' || status === 'UNDER_REVIEW' || status === 'CLARIFICATION_REQUIRED') {
      items.push({
        actionId: `ACT-M03-${fdr.id || fdr.fdrId}`,
        sourceModule: SOURCE_MODULES.MODULE_03_FDR,
        sourceEntityId: String(fdr.id || fdr.fdrId),
        institutionId: String(fdr.institutionId),
        institutionName: fdr.institutionName || `Institution #${fdr.institutionId}`,
        actionType: 'FDR_ADMINISTRATIVE_REVIEW',
        title: `FDR Submission Scrutiny: ${fdr.fdrNumber}`,
        priority: status === 'CLARIFICATION_REQUIRED' ? RISK_PRIORITY.HIGH : RISK_PRIORITY.MEDIUM,
        status,
        assignedOfficerId: fdr.assignedOfficerId || null,
        dueDate: fdr.maturityDate || null,
        createdAt: fdr.createdAt || fdr.depositDate || new Date().toISOString(),
        evidenceReferences: [`FDR #${fdr.fdrNumber}`, `Bank: ${fdr.bankName}`],
        destinationRoute: `/officer/fdr/${fdr.id || fdr.fdrId}`,
      });
    }
  });

  // 2. Module 04: Document Intelligence Scrutiny
  allAnalyses.forEach((analysis) => {
    const unresolved = (analysis.findings || []).filter((f) => f.status !== 'RESOLVED' && f.status !== 'DISMISSED');
    if (unresolved.length > 0) {
      const highestSev = unresolved.some((f) => f.severity === 'HIGH' || f.severity === 'CRITICAL')
        ? RISK_PRIORITY.HIGH
        : RISK_PRIORITY.MEDIUM;

      items.push({
        actionId: `ACT-M04-${analysis.analysisId}`,
        sourceModule: SOURCE_MODULES.MODULE_04_DOC_INTEL,
        sourceEntityId: analysis.analysisId,
        institutionId: String(analysis.institutionId || 'inst-001'),
        institutionName: analysis.institutionName || 'Institutional Deposit Document',
        actionType: 'DOCUMENT_INTELLIGENCE_REVIEW',
        title: `OCR Extraction Anomalies: ${analysis.fdrNumber || analysis.analysisId} (${unresolved.length} findings)`,
        priority: highestSev,
        status: 'UNRESOLVED_FINDINGS',
        assignedOfficerId: null,
        dueDate: null,
        createdAt: analysis.analyzedAt || analysis.createdAt || new Date().toISOString(),
        evidenceReferences: unresolved.map((f) => `${f.field}: ${f.findingType}`),
        destinationRoute: `/officer/document-intelligence`,
      });
    }
  });

  // 3. Module 05: Simulated Bank Verification Reviews
  allBankVerifs.forEach((verif) => {
    if (verif.status === 'RESPONSE_RECEIVED' && (verif.lienMarked === false || verif.reviewStatus === 'REQUIRES_FOLLOW_UP')) {
      items.push({
        actionId: `ACT-M05-${verif.requestId}`,
        sourceModule: SOURCE_MODULES.MODULE_05_BANK_SIM,
        sourceEntityId: verif.requestId,
        institutionId: String(verif.institutionId || 'inst-001'),
        institutionName: verif.institutionName || `Institution #${verif.institutionId}`,
        actionType: 'BANK_VERIFICATION_REVIEW',
        title: `[SIMULATED] Bank Confirmation Follow-Up: ${verif.requestReference || verif.requestId}`,
        priority: RISK_PRIORITY.MEDIUM, // Enforce non-banking cap
        status: verif.reviewStatus || 'PENDING_REVIEW',
        assignedOfficerId: verif.assignedOfficerId || null,
        dueDate: null,
        createdAt: verif.createdAt || new Date().toISOString(),
        evidenceReferences: [`Simulated SFMS ref: ${verif.requestReference}`, `Lien: ${verif.lienMarked ? 'YES' : 'UNCONFIRMED'}`],
        destinationRoute: `/officer/bank-verifications/${verif.requestId}`,
      });
    }
  });

  // 4. Module 06: Compliance Cases
  allCases.forEach((c) => {
    if (c.status === 'OPEN' || c.status === 'UNDER_REVIEW' || c.status === 'FOLLOW_UP_REQUESTED') {
      items.push({
        actionId: `ACT-M06-${c.caseId}`,
        sourceModule: SOURCE_MODULES.MODULE_06_COMPLIANCE,
        sourceEntityId: c.caseId,
        institutionId: String(c.institutionId),
        institutionName: c.institutionName || `Institution #${c.institutionId}`,
        actionType: 'COMPLIANCE_CASE_REVIEW',
        title: `Compliance Case: ${c.caseNumber || c.caseId} — ${c.title}`,
        priority: c.priority === 'CRITICAL' ? RISK_PRIORITY.CRITICAL : c.priority === 'HIGH' ? RISK_PRIORITY.HIGH : RISK_PRIORITY.MEDIUM,
        status: c.status,
        assignedOfficerId: c.assignedOfficerId || null,
        dueDate: null,
        createdAt: c.createdAt || new Date().toISOString(),
        evidenceReferences: [`Case ${c.caseNumber}`, `Status: ${c.status}`],
        destinationRoute: `/officer/compliance/${c.institutionId}`,
      });
    }
  });

  // 5. Module 07: Renewal Requests
  allRenewals.forEach((r) => {
    if (r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW' || r.status === 'CLARIFICATION_REQUIRED' || r.status === 'RESUBMITTED') {
      items.push({
        actionId: `ACT-M07-RNL-${r.renewalRequestId}`,
        sourceModule: SOURCE_MODULES.MODULE_07_RENEWAL,
        sourceEntityId: r.renewalRequestId,
        institutionId: String(r.institutionId),
        institutionName: r.institutionName || `Institution #${r.institutionId}`,
        actionType: 'RENEWAL_SCRUTINY',
        title: `Renewal Application Scrutiny: ${r.renewalReference || r.renewalRequestId}`,
        priority: r.status === 'CLARIFICATION_REQUIRED' ? RISK_PRIORITY.HIGH : RISK_PRIORITY.MEDIUM,
        status: r.status,
        assignedOfficerId: r.assignedOfficerId || null,
        dueDate: r.oldMaturityDate || null,
        createdAt: r.submittedAt || r.createdAt || new Date().toISOString(),
        evidenceReferences: [`Ref: ${r.renewalReference}`, `Orig FDR: ${r.originalFdrNumber}`],
        destinationRoute: `/officer/renewals/${r.renewalRequestId}`,
      });
    }
  });

  // 6. Module 07: Administrative Release Requests
  allReleases.forEach((rel) => {
    if (rel.status === 'SUBMITTED' || rel.status === 'UNDER_REVIEW' || rel.status === 'CLARIFICATION_REQUIRED') {
      items.push({
        actionId: `ACT-M07-REL-${rel.requestId}`,
        sourceModule: SOURCE_MODULES.MODULE_07_RELEASE,
        sourceEntityId: rel.requestId,
        institutionId: String(rel.institutionId),
        institutionName: rel.institutionName || `Institution #${rel.institutionId}`,
        actionType: 'RELEASE_SCRUTINY',
        title: `Administrative Release Request: ${rel.requestReference || rel.requestId}`,
        priority: RISK_PRIORITY.MEDIUM,
        status: rel.status,
        assignedOfficerId: rel.assignedOfficerId || null,
        dueDate: null,
        createdAt: rel.createdAt || new Date().toISOString(),
        evidenceReferences: [`Ref: ${rel.requestReference}`, `Target FDR: ${rel.originalFdrNumber}`],
        destinationRoute: `/officer/release-requests/${rel.requestId}`,
      });
    }
  });

  // 7. Module 07: Escalations
  allEscalations.forEach((esc) => {
    if (esc.status === 'OPEN' || esc.status === 'ACKNOWLEDGED') {
      items.push({
        actionId: `ACT-M07-ESC-${esc.escalationId}`,
        sourceModule: SOURCE_MODULES.MODULE_07_ESCALATION,
        sourceEntityId: esc.escalationId,
        institutionId: String(esc.institutionId),
        institutionName: esc.institutionName || `Institution #${esc.institutionId}`,
        actionType: 'ESCALATION_FOLLOW_UP',
        title: `Operational Escalation: ${esc.reason}`,
        priority: esc.severity === 'URGENT' ? RISK_PRIORITY.CRITICAL : RISK_PRIORITY.HIGH,
        status: esc.status,
        assignedOfficerId: esc.assignedTo || null,
        dueDate: esc.dueDate || null,
        createdAt: esc.createdAt || new Date().toISOString(),
        evidenceReferences: [`Escalation ID: ${esc.escalationId}`, `Trigger: ${esc.triggerDate}`],
        destinationRoute: `/admin/renewal-monitoring`,
      });
    }
  });

  // Filter by assigned officer if specified
  const filtered = filterOfficerId
    ? items.filter((item) => String(item.assignedOfficerId) === String(filterOfficerId))
    : items;

  // Sort by priority descending (CRITICAL -> HIGH -> MEDIUM -> LOW -> INFO) and creation date descending
  const priorityOrder = {
    [RISK_PRIORITY.CRITICAL]: 0,
    [RISK_PRIORITY.HIGH]: 1,
    [RISK_PRIORITY.MEDIUM]: 2,
    [RISK_PRIORITY.LOW]: 3,
    [RISK_PRIORITY.INFORMATIONAL]: 4,
    [RISK_PRIORITY.INDETERMINATE]: 5,
  };

  return filtered.sort((a, b) => {
    const pDiff = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
    if (pDiff !== 0) return pDiff;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}
