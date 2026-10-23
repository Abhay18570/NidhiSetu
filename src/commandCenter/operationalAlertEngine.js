/**
 * NidhiSetu Command Center — Operational Alert Engine
 * Evaluates real-time portfolio risks and synthesizes idempotent operational alerts.
 * Integrates with operationalAlertRepository and notificationRepository.
 *
 * CRITICAL REQUIREMENTS:
 * - Deterministic alert fingerprints prevent repeated alert generation loops.
 * - Alerts for simulated bank events explicitly labeled [SIMULATED].
 * - High and critical alert dismissals require recorded justification.
 */

import { operationalAlertRepository } from '../storage/operationalAlertRepository';
import { aggregatePortfolio } from './portfolioAggregator';
import { ALERT_STATUS, ALERT_SEVERITY, SOURCE_MODULES } from './commandCenterModel';

/**
 * Scans the portfolio and updates active operational alerts.
 * Idempotent execution safe for periodic invocation.
 */
export async function evaluateOperationalAlerts() {
  const portfolio = await aggregatePortfolio();
  const generatedAlerts = [];
  const now = new Date();

  portfolio.institutions.forEach((inst) => {
    // 1. Critical Matured Deposit Without Successor
    if (inst.maturedFdrs > 0 && inst.activeRenewalCount === 0) {
      generatedAlerts.push({
        alertType: 'CRITICAL_MATURED_UNRENEWED',
        entityType: 'INSTITUTION_PORTFOLIO',
        entityId: inst.institutionId,
        institutionId: inst.institutionId,
        institutionName: inst.institutionName,
        severity: ALERT_SEVERITY.CRITICAL,
        title: `Matured Security Deposit Interval Unsecured: ${inst.institutionName}`,
        description: `${inst.maturedFdrs} deposit(s) have matured with zero active renewal submissions. Deposit continuity is breached.`,
        sourceModule: SOURCE_MODULES.MODULE_07_RENEWAL,
        fingerprint: `FPR-MATURED-UNRENEWED-${inst.institutionId}`,
      });
    }

    // 2. Declared Deposit Shortfall
    if (inst.hasComplianceShortfall && inst.shortfallPaise > 0) {
      generatedAlerts.push({
        alertType: 'COMPLIANCE_SHORTFALL_EXPOSURE',
        entityType: 'COMPLIANCE_ASSESSMENT',
        entityId: inst.latestComplianceAssessment?.id || inst.institutionId,
        institutionId: inst.institutionId,
        institutionName: inst.institutionName,
        severity: ALERT_SEVERITY.HIGH,
        title: `Declared Deposit Deficit: ₹${((inst.shortfallPaise || 0) / 100).toLocaleString('en-IN')}`,
        description: `Deposit adequacy evaluation identifies a shortfall of ₹${((inst.shortfallPaise || 0) / 100).toLocaleString('en-IN')} against regulatory norms.`,
        sourceModule: SOURCE_MODULES.MODULE_06_COMPLIANCE,
        fingerprint: `FPR-SHORTFALL-${inst.institutionId}-${inst.shortfallPaise}`,
      });
    }

    // 3. Simulated Bank Discrepancy
    if (inst.simulatedBankFindingCount > 0) {
      generatedAlerts.push({
        alertType: 'SIMULATED_BANK_DISCREPANCY',
        entityType: 'BANK_VERIFICATION',
        entityId: inst.institutionId,
        institutionId: inst.institutionId,
        institutionName: inst.institutionName,
        severity: ALERT_SEVERITY.MEDIUM,
        title: `[SIMULATED] Bank Confirmation Returned Discrepancies (${inst.simulatedBankFindingCount})`,
        description: `Simulated SFMS/CBS confirmation records lack confirmed lien flags or returned transmission failures.`,
        sourceModule: SOURCE_MODULES.MODULE_05_BANK_SIM,
        fingerprint: `FPR-BANK-DISCREPANCY-${inst.institutionId}`,
      });
    }

    // 4. Unresolved Document Intelligence Findings
    if (inst.unresolvedDocumentFindingCount > 2) {
      generatedAlerts.push({
        alertType: 'DOC_INTEL_HIGH_FINDING_VOLUME',
        entityType: 'DOCUMENT_ANALYSIS',
        entityId: inst.institutionId,
        institutionId: inst.institutionId,
        institutionName: inst.institutionName,
        severity: ALERT_SEVERITY.MEDIUM,
        title: `Multiple Document Anomalies Flagged (${inst.unresolvedDocumentFindingCount})`,
        description: `Scanned certificate intelligence detected ${inst.unresolvedDocumentFindingCount} unresolved OCR or metadata findings.`,
        sourceModule: SOURCE_MODULES.MODULE_04_DOC_INTEL,
        fingerprint: `FPR-DOC-FINDINGS-${inst.institutionId}`,
      });
    }
  });

  // Persist and return deduplicated alerts
  return await operationalAlertRepository.upsertAlerts(generatedAlerts);
}

/**
 * Acknowledges an active operational alert.
 */
export async function acknowledgeOperationalAlert(alertId, officerId) {
  return await operationalAlertRepository.acknowledgeAlert(alertId, officerId);
}

/**
 * Dismisses an operational alert with mandatory justification for high/critical severities.
 */
export async function dismissOperationalAlert(alertId, officerId, reason) {
  return await operationalAlertRepository.dismissAlert(alertId, officerId, reason);
}

/**
 * Marks an operational alert resolved.
 */
export async function resolveOperationalAlert(alertId, officerId, resolutionNotes) {
  return await operationalAlertRepository.resolveAlert(alertId, officerId, resolutionNotes);
}
