/**
 * NidhiSetu Unified Compliance Assessment Engine & Builder
 * Combines regulatory rules, integer deposit adequacy, calendar-safe maturity risks,
 * Module 04 document findings, and Module 05 simulated bank evidence.
 *
 * Implements deterministic canonical fingerprints to detect data changes
 * and manage reassessment lineage without mutating historical records.
 */

import { resolveApplicableRule } from './complianceRuleEngine';
import { calculateDepositAdequacy } from './depositAdequacyEngine';
import { evaluateMaturityRisks } from './maturityRiskEngine';
import { extractAllDocumentRisks } from './documentRiskAdapter';
import { extractAllBankEvidence } from './bankEvidenceAdapter';
import { prioritizeComplianceRisks } from './complianceRiskEngine';
import { PROTOTYPE_COMPLIANCE_DISCLAIMER } from './complianceDemoFixtures';

export const ASSESSMENT_ENGINE_VERSION = '1.0.0-PROTOTYPE';

export const ASSESSMENT_STATUS = {
  NOT_ASSESSED: 'NOT_ASSESSED',
  ASSESSMENT_READY: 'ASSESSMENT_READY',
  REVIEW_RECOMMENDED: 'REVIEW_RECOMMENDED',
  INDETERMINATE: 'INDETERMINATE',
  STALE: 'STALE',
};

/**
 * Computes a deterministic canonical fingerprint string for input parameters.
 * Sorts object keys recursively to avoid arbitrary JavaScript property order shifts.
 */
export function generateCanonicalFingerprint(inputObj) {
  function canonicalize(val) {
    if (val === null || typeof val !== 'object') {
      return val;
    }
    if (Array.isArray(val)) {
      return val.map(canonicalize);
    }
    const sortedKeys = Object.keys(val).sort();
    const result = {};
    for (const key of sortedKeys) {
      result[key] = canonicalize(val[key]);
    }
    return result;
  }

  const clean = canonicalize(inputObj);
  const jsonStr = JSON.stringify(clean);

  // Simple, deterministic 32-bit FNV-1a hash formatted as hex
  let hash = 0x811c9dc5;
  for (let i = 0; i < jsonStr.length; i++) {
    hash ^= jsonStr.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return `FPR-${hash.toString(16).padStart(8, '0')}`;
}

/**
 * Builds a comprehensive, immutable compliance assessment snapshot.
 *
 * @param {Object} params
 * @param {Object} params.institution - Target institution record
 * @param {Array} params.rules - All available compliance rules
 * @param {Array} params.fdrRecords - Institution's FDR records
 * @param {string|Date} params.assessmentDate - Reference date
 * @param {Object} params.previousAssessment - Preceding assessment snapshot if reassessing
 * @returns {Promise<Object>} Completed assessment snapshot
 */
export async function buildComplianceAssessment({
  institution,
  rules = [],
  fdrRecords = [],
  assessmentDate = new Date(),
  previousAssessment = null,
}) {
  if (!institution || !institution.id) {
    throw new Error('Valid institution record is required to build compliance assessment.');
  }

  const institutionId = String(institution.id);
  const evalDate = new Date(assessmentDate).toISOString().split('T')[0];

  // 1. Resolve applicable regulatory rule
  const ruleResolution = resolveApplicableRule(institution, rules, assessmentDate);
  const applicableRule = ruleResolution.rule;

  // 2. Filter FDRs belonging to this institution
  const institutionFdrs = fdrRecords.filter(
    (fdr) => String(fdr.institutionId) === institutionId
  );

  // 3. Calculate deposit adequacy
  const adequacyResult = calculateDepositAdequacy({
    institutionId,
    applicableRule,
    fdrRecords: institutionFdrs,
    assessmentDate,
  });

  // 4. Evaluate maturity and renewal risks
  const maturityFindings = evaluateMaturityRisks({
    fdrRecords: institutionFdrs,
    eligibleDeposits: adequacyResult.eligibleDeposits,
    applicableRule,
    assessmentDate,
  });

  // 5. Extract document intelligence findings (Module 04 non-mutating adapter)
  const { allFindings: documentFindings, adapterResults: docAdapterResults } =
    await extractAllDocumentRisks(institutionFdrs);

  // 6. Extract simulated bank evidence (Module 05 strictly labeled adapter)
  const { allFindings: bankFindings, adapterResults: bankAdapterResults } =
    await extractAllBankEvidence(institutionFdrs);

  // 7. Prioritize risks
  const riskAnalysis = prioritizeComplianceRisks({
    adequacyResult,
    maturityFindings,
    documentFindings,
    bankSimulationFindings: bankFindings,
  });

  // 8. Determine overall assessment status
  let assessmentStatus = ASSESSMENT_STATUS.ASSESSMENT_READY;
  if (ruleResolution.status === 'REQUIREMENT_NOT_CONFIGURED') {
    assessmentStatus = ASSESSMENT_STATUS.INDETERMINATE;
  } else if (ruleResolution.status === 'AMBIGUOUS_RULE_SELECTION') {
    assessmentStatus = ASSESSMENT_STATUS.INDETERMINATE;
  } else if (['HIGH', 'CRITICAL'].includes(riskAnalysis.overallPriority)) {
    assessmentStatus = ASSESSMENT_STATUS.REVIEW_RECOMMENDED;
  }

  // 9. Generate canonical input fingerprint
  const fingerprintPayload = {
    institutionId,
    ruleId: applicableRule ? applicableRule.ruleId : 'NO_RULE',
    ruleVersion: applicableRule ? applicableRule.ruleVersion : 0,
    evalDate,
    fdrFingerprints: institutionFdrs
      .map((f) => ({
        id: f.id || f.fdrId,
        fdrNumber: f.fdrNumber,
        amount: f.amountPaise || f.amount,
        status: f.status,
        hash: f.sha256Hash || f.documentHash || '',
      }))
      .sort((a, b) => String(a.id).localeCompare(String(b.id))),
  };

  const inputFingerprint = generateCanonicalFingerprint(fingerprintPayload);

  const now = new Date().toISOString();
  const assessmentId = `CAS-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  return {
    assessmentId,
    institutionId,
    institutionName: institution.name || institution.institutionName,
    institutionCode: institution.code || institution.institutionCode,
    institutionCategory: institution.category || institution.institutionType || 'ENGINEERING',
    assessmentDate: evalDate,
    ruleId: applicableRule ? applicableRule.ruleId : null,
    ruleCode: applicableRule ? applicableRule.ruleCode : null,
    ruleVersion: applicableRule ? applicableRule.ruleVersion : null,
    ruleStatus: applicableRule ? applicableRule.ruleStatus : null,
    ruleTitle: applicableRule ? applicableRule.title : null,
    ruleResolutionStatus: ruleResolution.status,
    assessmentEngineVersion: ASSESSMENT_ENGINE_VERSION,

    // Related FDR IDs
    relatedFdrIds: institutionFdrs.map((f) => f.id || f.fdrId),

    // Financial adequacy in integer paise
    requiredAmountPaise: adequacyResult.requiredAmountPaise,
    eligibleDeclaredAmountPaise: adequacyResult.eligibleDeclaredAmountPaise,
    shortfallPaise: adequacyResult.shortfallPaise,
    surplusPaise: adequacyResult.surplusPaise,
    coveragePercentage: adequacyResult.coveragePercentage,
    adequacyStatus: adequacyResult.adequacyStatus,
    eligibleDeposits: adequacyResult.eligibleDeposits,
    excludedDeposits: adequacyResult.excludedDeposits,

    // Risk findings
    maturityFindings,
    documentFindings,
    simulatedBankFindings: bankFindings,

    // Prioritized risk aggregation
    riskAnalysis,
    overallPriority: riskAnalysis.overallPriority,
    assessmentStatus,

    // Evidence References & Adapter summaries
    evidenceReferences: {
      documentAnalyses: docAdapterResults,
      bankSimulations: bankAdapterResults,
    },

    // Reproducibility & Lineage
    inputFingerprint,
    previousAssessmentId: previousAssessment ? previousAssessment.assessmentId : null,
    reassessmentCount: previousAssessment ? (previousAssessment.reassessmentCount || 0) + 1 : 0,
    disclaimer: PROTOTYPE_COMPLIANCE_DISCLAIMER,
    createdAt: now,
    updatedAt: now,
  };
}
