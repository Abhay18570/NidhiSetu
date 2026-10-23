/**
 * NidhiSetu Command Center — Explainable Risk Prioritization Engine
 * Deterministic, transparent operational prioritization across multi-module security deposit footprints.
 *
 * CRITICAL REGULATORY & ETHICAL SPECIFICATION:
 * - NEVER generates opaque probability scores or fake "fraud probabilities".
 * - A simulated bank discrepancy alone NEVER produces a real-world CRITICAL compliance determination.
 * - OCR extraction uncertainty is NEVER classified as confirmed institutional wrongdoing.
 * - Every priority output is fully explainable with triggering signals and evidentiary references.
 */

import { RISK_PRIORITY, SOURCE_MODULES } from './commandCenterModel';

/**
 * Evaluates an institution's aggregated profile and assigns an explainable operational priority.
 *
 * @param {Object} institutionProfile - Aggregated institution record from portfolioAggregator
 */
export function evaluateInstitutionRiskPriority(institutionProfile) {
  if (!institutionProfile) {
    return {
      priority: RISK_PRIORITY.INDETERMINATE,
      triggeringSignals: ['No profile data provided'],
      evidenceReferences: [],
      explanation: 'Institution data could not be resolved.',
      recommendedNextAction: 'Verify institutional registration and active FDR status.',
      sourceModule: 'SYSTEM',
      lastUpdated: new Date().toISOString(),
    };
  }

  const signals = [];
  const evidenceRefs = [];
  let calculatedPriority = RISK_PRIORITY.INFORMATIONAL;
  let explanation = 'Deposit portfolio satisfies declared operational and regulatory criteria.';
  let nextAction = 'Continue routine monitoring according to standard approval cycle.';
  let primarySource = SOURCE_MODULES.MODULE_03_FDR;

  // 1. Matured FDR without valid replacement (Critical operational attention)
  if (institutionProfile.maturedFdrs > 0 && institutionProfile.activeRenewalCount === 0) {
    calculatedPriority = RISK_PRIORITY.CRITICAL;
    signals.push(`CRITICAL_MATURED_DEPOSIT: ${institutionProfile.maturedFdrs} deposit(s) have matured without active replacement submission.`);
    evidenceRefs.push(`Matured FDR Count: ${institutionProfile.maturedFdrs}`);
    explanation = 'Deposit tenure has elapsed without successor FDR submission, creating an unsecured regulatory interval.';
    nextAction = 'Issue urgent requisition to institution to furnish renewed FDR or replacement guarantee.';
    primarySource = SOURCE_MODULES.MODULE_07_RENEWAL;
  }

  // 2. Significant Declared Shortfall (High / Critical depending on magnitude)
  if (institutionProfile.hasComplianceShortfall && institutionProfile.shortfallPaise > 0) {
    const shortfallRupees = institutionProfile.shortfallPaise / 100;
    signals.push(`DEPOSIT_SHORTFALL: Declared eligible coverage has a deficit of ₹${shortfallRupees.toLocaleString('en-IN')}.`);
    evidenceRefs.push(`Assessment Shortfall: ₹${shortfallRupees.toLocaleString('en-IN')}`);

    if (calculatedPriority !== RISK_PRIORITY.CRITICAL) {
      calculatedPriority = RISK_PRIORITY.HIGH;
      explanation = `Institutional deposit adequacy review identified a declared shortfall of ₹${shortfallRupees.toLocaleString('en-IN')}.`;
      nextAction = 'Open or review compliance follow-up case to solicit supplementary deposit certificate.';
      primarySource = SOURCE_MODULES.MODULE_06_COMPLIANCE;
    }
  }

  // 3. Open Compliance Cases
  if (institutionProfile.openComplianceCaseCount > 0) {
    signals.push(`ACTIVE_COMPLIANCE_CASE: ${institutionProfile.openComplianceCaseCount} open compliance adjudication case(s).`);
    evidenceRefs.push(`Open Cases: ${institutionProfile.openComplianceCaseCount}`);
    if (calculatedPriority === RISK_PRIORITY.INFORMATIONAL || calculatedPriority === RISK_PRIORITY.LOW) {
      calculatedPriority = RISK_PRIORITY.HIGH;
      explanation = 'Institution is actively under formal regulatory case scrutiny.';
      nextAction = 'Review pending clarification responses in the officer case workspace.';
      primarySource = SOURCE_MODULES.MODULE_06_COMPLIANCE;
    }
  }

  // 4. Unresolved Document Intelligence Anomaly (Module 04)
  if (institutionProfile.unresolvedDocumentFindingCount > 0) {
    signals.push(`OCR_EXTRACTION_ANOMALY: ${institutionProfile.unresolvedDocumentFindingCount} unresolved document intelligence finding(s).`);
    evidenceRefs.push(`Document Findings: ${institutionProfile.unresolvedDocumentFindingCount}`);
    if (calculatedPriority === RISK_PRIORITY.INFORMATIONAL || calculatedPriority === RISK_PRIORITY.LOW) {
      calculatedPriority = RISK_PRIORITY.MEDIUM;
      explanation = 'Mathematical, text, or duplicate OCR extraction discrepancies require scrutiny review.';
      nextAction = 'Examine OCR comparison table and confirm or dismiss document finding.';
      primarySource = SOURCE_MODULES.MODULE_04_DOC_INTEL;
    }
  }

  // 5. Simulated Bank Verification Mismatch (Module 05)
  // BOUNDARY ENFORCED: Must NOT elevate to CRITICAL by itself
  if (institutionProfile.simulatedBankFindingCount > 0) {
    signals.push(`[SIMULATED] BANK_DISCREPANCY: ${institutionProfile.simulatedBankFindingCount} simulated verification response(s) flagged unconfirmed lien.`);
    evidenceRefs.push(`Simulated Bank Flag Count: ${institutionProfile.simulatedBankFindingCount}`);
    if (calculatedPriority === RISK_PRIORITY.INFORMATIONAL) {
      calculatedPriority = RISK_PRIORITY.MEDIUM;
      explanation = 'Simulated mock CBS verification returned without confirmed joint lien notation (Simulation Signal).';
      nextAction = 'Request physical bank confirmation letter or re-run simulated verification query.';
      primarySource = SOURCE_MODULES.MODULE_05_BANK_SIM;
    }
  }

  // 6. Outstanding Escalations (Module 07)
  if (institutionProfile.unresolvedEscalationCount > 0) {
    signals.push(`SYSTEM_ESCALATION: ${institutionProfile.unresolvedEscalationCount} unresolved renewal or review escalation(s).`);
    evidenceRefs.push(`Active Escalations: ${institutionProfile.unresolvedEscalationCount}`);
    if (calculatedPriority === RISK_PRIORITY.INFORMATIONAL) {
      calculatedPriority = RISK_PRIORITY.HIGH;
      explanation = 'Automated monitoring triggers flagged overdue follow-ups or approaching critical deadlines.';
      nextAction = 'Acknowledge and assign escalation item in the Command Center inbox.';
      primarySource = SOURCE_MODULES.MODULE_07_ESCALATION;
    }
  }

  return {
    priority: calculatedPriority,
    triggeringSignals: signals.length > 0 ? signals : ['STANDARD_OPERATIONAL_COMPLIANCE'],
    evidenceReferences: evidenceRefs,
    explanation,
    recommendedNextAction: nextAction,
    sourceModule: primarySource,
    lastUpdated: new Date().toISOString(),
  };
}
