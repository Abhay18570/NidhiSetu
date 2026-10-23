/**
 * NidhiSetu Command Center Data Model & Schemas
 * Defines enums, schemas, validation logic, and regulatory disclaimers for Module 08.
 *
 * CRITICAL REGULATORY & EDUCATIONAL BOUNDARY:
 * Module 08 is an orchestration, aggregation, and visualization layer.
 * It never alters underlying domain models directly, never executes real banking
 * operations, and never represents simulated verification signals as commercial bank confirmations.
 */

export const RISK_PRIORITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  INFORMATIONAL: 'INFORMATIONAL',
  INDETERMINATE: 'INDETERMINATE',
};

export const ALERT_STATUS = {
  ACTIVE: 'ACTIVE',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED',
};

export const ALERT_SEVERITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  INFO: 'INFO',
};

export const SOURCE_MODULES = {
  MODULE_03_FDR: 'MODULE_03_FDR',
  MODULE_04_DOC_INTEL: 'MODULE_04_DOC_INTEL',
  MODULE_05_BANK_SIM: 'MODULE_05_BANK_SIM',
  MODULE_06_COMPLIANCE: 'MODULE_06_COMPLIANCE',
  MODULE_07_RENEWAL: 'MODULE_07_RENEWAL',
  MODULE_07_RELEASE: 'MODULE_07_RELEASE',
  MODULE_07_ESCALATION: 'MODULE_07_ESCALATION',
};

export const REPORT_TYPES = {
  PORTFOLIO_SUMMARY: 'PORTFOLIO_SUMMARY',
  INSTITUTION_INTELLIGENCE: 'INSTITUTION_INTELLIGENCE',
  OFFICER_WORKLOAD: 'OFFICER_WORKLOAD',
  MATURITY_EXPOSURE: 'MATURITY_EXPOSURE',
  COMPLIANCE_ATTENTION: 'COMPLIANCE_ATTENTION',
  RENEWAL_OPERATIONS: 'RENEWAL_OPERATIONS',
};

export const COMMAND_CENTER_PROTOTYPE_DISCLAIMER =
  'NidhiSetu Prototype Analytics — Not an Official Regulatory Determination.';

export const BANK_SIMULATION_DISCLAIMER =
  'Bank Confirmation Data Is Simulated — No Real Bank Verification Performed.';

export const DEFAULT_COMMAND_CENTER_PREFERENCES = {
  defaultDateRange: '30D', // '7D' | '30D' | '90D' | 'ALL'
  tableDensity: 'compact', // 'compact' | 'comfortable'
  visibleSections: {
    kpiOverview: true,
    riskDistribution: true,
    lifecycleDistribution: true,
    maturityMonitoring: true,
    actionQueue: true,
    recentActivity: true,
    institutionList: true,
    dataQuality: true,
  },
  refreshIntervalSeconds: 60,
};
