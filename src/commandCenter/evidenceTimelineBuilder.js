/**
 * NidhiSetu Command Center — Cross-Module Evidence Timeline Builder
 * Merges historical records across Modules 03–07 into an immutable, chronological regulatory trail.
 *
 * CRITICAL REQUIREMENTS:
 * - Sorts events strictly chronologically.
 * - Deduplicates repeated representations of the same event.
 * - Categorizes actor roles: INSTITUTION_ACTION, OFFICER_DECISION, AUTOMATED_ASSESSMENT, SIMULATED_BANKING.
 * - Never invents timestamps or events.
 */

import { SOURCE_MODULES } from './commandCenterModel';

export const EVENT_ACTOR_TYPE = {
  INSTITUTION_ACTION: 'INSTITUTION_ACTION',
  OFFICER_DECISION: 'OFFICER_DECISION',
  AUTOMATED_ASSESSMENT: 'AUTOMATED_ASSESSMENT',
  SIMULATED_BANKING: 'SIMULATED_BANKING',
};

/**
 * Builds a unified, chronological timeline across all provided module records.
 *
 * @param {Object} datasets - Object containing arrays of entities
 * @returns {Array<Object>} Sorted list of timeline events
 */
export function buildEvidenceTimeline(datasets = {}) {
  const {
    institutionId,
    fdrs = [],
    analyses = [],
    bankVerifications = [],
    assessments = [],
    cases = [],
    renewals = [],
    releases = [],
    escalations = [],
  } = datasets;

  const events = [];
  const seenEventKeys = new Set();

  function addEvent(evt) {
    if (!evt.timestamp) return;
    const key = `${evt.sourceModule}_${evt.sourceEntityId}_${evt.eventType}_${evt.timestamp.slice(0, 16)}`;
    if (seenEventKeys.has(key)) return;
    seenEventKeys.add(key);
    events.push(evt);
  }

  // 1. FDR Events (Module 03)
  fdrs.forEach((fdr) => {
    const fdrId = fdr.id || fdr.fdrId;
    if (fdr.submittedAt || fdr.createdAt) {
      addEvent({
        eventId: `EVT-FDR-SUB-${fdrId}`,
        sourceModule: SOURCE_MODULES.MODULE_03_FDR,
        sourceEntityId: String(fdrId),
        institutionId: String(fdr.institutionId || institutionId),
        eventType: EVENT_ACTOR_TYPE.INSTITUTION_ACTION,
        actor: fdr.submittedBy || 'Institution Representative',
        timestamp: fdr.submittedAt || fdr.createdAt,
        summary: `FDR Submitted: Certificate #${fdr.fdrNumber || fdrId} for ₹${((fdr.depositAmountPaise || fdr.amountPaise || 0) / 100).toLocaleString('en-IN')}`,
        destinationRoute: `/officer/fdr/${fdrId}`,
        evidenceType: 'FDR_DEPOSIT_CERTIFICATE',
      });
    }

    if (fdr.reviewedAt) {
      addEvent({
        eventId: `EVT-FDR-REV-${fdrId}`,
        sourceModule: SOURCE_MODULES.MODULE_03_FDR,
        sourceEntityId: String(fdrId),
        institutionId: String(fdr.institutionId || institutionId),
        eventType: EVENT_ACTOR_TYPE.OFFICER_DECISION,
        actor: fdr.reviewedBy || 'Scrutiny Officer',
        timestamp: fdr.reviewedAt,
        summary: `FDR Scrutiny Outcome: ${fdr.status || fdr.lifecycleStatus} - ${fdr.scrutinyRemarks || 'Administrative review completed'}`,
        destinationRoute: `/officer/fdr/${fdrId}`,
        evidenceType: 'SCRUTINY_DECISION',
      });
    }
  });

  // 2. OCR & Document Intelligence Analyses (Module 04)
  analyses.forEach((ana) => {
    const anaId = ana.id || ana.analysisId;
    if (ana.analyzedAt || ana.createdAt) {
      const findingsCount = (ana.findings || []).length;
      addEvent({
        eventId: `EVT-DOC-ANA-${anaId}`,
        sourceModule: SOURCE_MODULES.MODULE_04_DOC_INTEL,
        sourceEntityId: String(anaId),
        institutionId: String(institutionId || ana.institutionId),
        eventType: EVENT_ACTOR_TYPE.AUTOMATED_ASSESSMENT,
        actor: 'NidhiSetu OCR Engine',
        timestamp: ana.analyzedAt || ana.createdAt,
        summary: `Document Intelligence Scanned: ${findingsCount} finding(s) detected with ${ana.confidenceScore || 90}% confidence`,
        destinationRoute: '/officer/document-intelligence',
        evidenceType: 'OCR_ANALYSIS_REPORT',
      });
    }
  });

  // 3. Simulated Bank Verifications (Module 05)
  bankVerifications.forEach((bv) => {
    const bvId = bv.id || bv.requestId;
    if (bv.requestedAt || bv.createdAt) {
      addEvent({
        eventId: `EVT-BANK-REQ-${bvId}`,
        sourceModule: SOURCE_MODULES.MODULE_05_BANK_SIM,
        sourceEntityId: String(bvId),
        institutionId: String(institutionId || bv.institutionId),
        eventType: EVENT_ACTOR_TYPE.OFFICER_DECISION,
        actor: bv.initiatedBy || 'Regulatory Officer',
        timestamp: bv.requestedAt || bv.createdAt,
        summary: `Lien Verification Initiated: Sent to ${bv.bankName || 'Branch'} [SIMULATED]`,
        destinationRoute: `/officer/bank-verifications/${bvId}`,
        evidenceType: 'BANK_CONFIRMATION_REQUEST',
      });
    }

    if (bv.respondedAt) {
      addEvent({
        eventId: `EVT-BANK-RES-${bvId}`,
        sourceModule: SOURCE_MODULES.MODULE_05_BANK_SIM,
        sourceEntityId: String(bvId),
        institutionId: String(institutionId || bv.institutionId),
        eventType: EVENT_ACTOR_TYPE.SIMULATED_BANKING,
        actor: `${bv.bankName || 'Bank'} SFMS Gateway [SIMULATED]`,
        timestamp: bv.respondedAt,
        summary: `Simulated Bank Response: Lien ${bv.lienMarked ? 'CONFIRMED' : 'NOT MARKED / DISCREPANCY'} - Ref: ${bv.cbsReferenceNumber || 'CBS-MOCK'}`,
        destinationRoute: `/officer/bank-verifications/${bvId}`,
        evidenceType: 'SIMULATED_BANK_RESPONSE',
      });
    }
  });

  // 4. Compliance Assessments (Module 06)
  assessments.forEach((ass) => {
    const assId = ass.id || ass.assessmentId;
    if (ass.assessedAt || ass.createdAt) {
      addEvent({
        eventId: `EVT-COMP-ASS-${assId}`,
        sourceModule: SOURCE_MODULES.MODULE_06_COMPLIANCE,
        sourceEntityId: String(assId),
        institutionId: String(ass.institutionId || institutionId),
        eventType: EVENT_ACTOR_TYPE.AUTOMATED_ASSESSMENT,
        actor: 'Compliance Intelligence Engine',
        timestamp: ass.assessedAt || ass.createdAt,
        summary: `Compliance Assessment: Status ${ass.adequacyStatus || (ass.shortfallPaise > 0 ? 'DEFICIT' : 'ADEQUATE')} (Shortfall: ₹${((ass.shortfallPaise || 0) / 100).toLocaleString('en-IN')})`,
        destinationRoute: `/officer/compliance/${ass.institutionId || institutionId}`,
        evidenceType: 'COMPLIANCE_EVALUATION',
      });
    }
  });

  // 5. Compliance Cases (Module 06)
  cases.forEach((cs) => {
    const csId = cs.id || cs.caseId;
    if (cs.openedAt || cs.createdAt) {
      addEvent({
        eventId: `EVT-COMP-CASE-OPN-${csId}`,
        sourceModule: SOURCE_MODULES.MODULE_06_COMPLIANCE,
        sourceEntityId: String(csId),
        institutionId: String(cs.institutionId || institutionId),
        eventType: EVENT_ACTOR_TYPE.OFFICER_DECISION,
        actor: cs.assignedOfficer || 'Compliance Officer',
        timestamp: cs.openedAt || cs.createdAt,
        summary: `Compliance Case Opened: Case #${cs.caseNumber || csId} - ${cs.title || 'Inquiry Initiated'}`,
        destinationRoute: `/officer/compliance-cases/${csId}`,
        evidenceType: 'COMPLIANCE_CASE_FILE',
      });
    }
  });

  // 6. Renewal Requests (Module 07)
  renewals.forEach((ren) => {
    const renId = ren.id || ren.requestId;
    if (ren.submittedAt || ren.createdAt) {
      addEvent({
        eventId: `EVT-REN-SUB-${renId}`,
        sourceModule: SOURCE_MODULES.MODULE_07_RENEWAL,
        sourceEntityId: String(renId),
        institutionId: String(ren.institutionId || institutionId),
        eventType: EVENT_ACTOR_TYPE.INSTITUTION_ACTION,
        actor: ren.submittedBy || 'Institution Representative',
        timestamp: ren.submittedAt || ren.createdAt,
        summary: `Renewal Request Submitted: For FDR #${ren.originalFdrNumber || ren.originalFdrId}`,
        destinationRoute: `/officer/renewals/${renId}`,
        evidenceType: 'RENEWAL_REQUEST_APPLICATION',
      });
    }

    if (ren.reviewedAt) {
      addEvent({
        eventId: `EVT-REN-REV-${renId}`,
        sourceModule: SOURCE_MODULES.MODULE_07_RENEWAL,
        sourceEntityId: String(renId),
        institutionId: String(ren.institutionId || institutionId),
        eventType: EVENT_ACTOR_TYPE.OFFICER_DECISION,
        actor: ren.reviewedBy || 'Renewal Officer',
        timestamp: ren.reviewedAt,
        summary: `Renewal Scrutiny: ${ren.status} - ${ren.reviewNotes || 'Administrative review completed'}`,
        destinationRoute: `/officer/renewals/${renId}`,
        evidenceType: 'RENEWAL_DECISION',
      });
    }
  });

  // 7. Release Requests (Module 07)
  releases.forEach((rel) => {
    const relId = rel.id || rel.requestId;
    if (rel.submittedAt || rel.createdAt) {
      addEvent({
        eventId: `EVT-REL-SUB-${relId}`,
        sourceModule: SOURCE_MODULES.MODULE_07_RELEASE,
        sourceEntityId: String(relId),
        institutionId: String(rel.institutionId || institutionId),
        eventType: EVENT_ACTOR_TYPE.INSTITUTION_ACTION,
        actor: rel.submittedBy || 'Institution Representative',
        timestamp: rel.submittedAt || rel.createdAt,
        summary: `Administrative Release Requested: FDR #${rel.fdrNumber || rel.fdrId}`,
        destinationRoute: `/officer/release-requests/${relId}`,
        evidenceType: 'RELEASE_REQUEST_APPLICATION',
      });
    }
  });

  // 8. Escalations (Module 07)
  escalations.forEach((esc) => {
    const escId = esc.id || esc.escalationId;
    if (esc.escalatedAt || esc.createdAt) {
      addEvent({
        eventId: `EVT-ESC-OPN-${escId}`,
        sourceModule: SOURCE_MODULES.MODULE_07_ESCALATION,
        sourceEntityId: String(escId),
        institutionId: String(esc.institutionId || institutionId),
        eventType: EVENT_ACTOR_TYPE.OFFICER_DECISION,
        actor: esc.escalatedBy || 'System Escalation Monitor',
        timestamp: esc.escalatedAt || esc.createdAt,
        summary: `Continuity Escalation Logged: ${esc.reason || 'Maturity interval breached'}`,
        destinationRoute: '/admin/renewal-monitoring',
        evidenceType: 'ESCALATION_RECORD',
      });
    }
  });

  // Sort strictly chronologically descending (most recent first)
  return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
