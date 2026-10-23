/**
 * NidhiSetu Explainable Risk Prioritization Engine
 * Determines deterministic categorical compliance risk levels:
 * INFORMATIONAL, LOW, MEDIUM, HIGH, CRITICAL.
 *
 * Explicitly avoids fabricated "AI fraud probabilities" or opaque scoring.
 * All indicators are fully explainable with references to configured rules and evidence.
 */

export const RISK_LEVELS = {
  INFORMATIONAL: 'INFORMATIONAL',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

const SEVERITY_WEIGHTS = {
  [RISK_LEVELS.INFORMATIONAL]: 0,
  [RISK_LEVELS.LOW]: 1,
  [RISK_LEVELS.MEDIUM]: 2,
  [RISK_LEVELS.HIGH]: 3,
  [RISK_LEVELS.CRITICAL]: 4,
};

/**
 * Aggregates adequacy, maturity, document, and simulated bank signals
 * to determine explainable risk indicators and an overall priority level.
 *
 * @param {Object} params
 * @param {Object} params.adequacyResult
 * @param {Array} params.maturityFindings
 * @param {Array} params.documentFindings
 * @param {Array} params.bankSimulationFindings
 * @returns {Object} Prioritized risk analysis
 */
export function prioritizeComplianceRisks({
  adequacyResult,
  maturityFindings = [],
  documentFindings = [],
  bankSimulationFindings = [],
}) {
  const indicators = [];

  // 1. Adequacy Risk Evaluation
  if (adequacyResult) {
    if (adequacyResult.adequacyStatus === 'SHORTFALL_DECLARED') {
      indicators.push({
        signalId: `RISK-ADEQUACY-SHORTFALL`,
        category: 'DEPOSIT_ADEQUACY',
        severity: RISK_LEVELS.HIGH,
        source: 'DEPOSIT_ADEQUACY_ENGINE',
        affectedRecord: adequacyResult.institutionId,
        explanation: `Declared deposit shortfall of ₹${(adequacyResult.shortfallPaise / 100).toLocaleString('en-IN')} (${adequacyResult.coveragePercentage}% coverage of required ₹${(adequacyResult.requiredAmountPaise / 100).toLocaleString('en-IN')}).`,
        recommendedAction: 'Issue formal compliance demand note for deposit replenishment.',
        reviewStatus: 'PENDING_OFFICER_REVIEW',
      });
    } else if (adequacyResult.adequacyStatus === 'REQUIREMENT_NOT_CONFIGURED') {
      indicators.push({
        signalId: `RISK-RULE-NOT-CONFIGURED`,
        category: 'REGULATORY_RULE',
        severity: RISK_LEVELS.INFORMATIONAL,
        source: 'COMPLIANCE_RULE_ENGINE',
        affectedRecord: adequacyResult.institutionId,
        explanation: 'No applicable regulatory deposit rule is configured for this institution in the prototype.',
        recommendedAction: 'Administrator should review and configure applicable rule for institution category.',
        reviewStatus: 'SYSTEM_FLAG',
      });
    }
  }

  // 2. Maturity & Renewal Risks
  maturityFindings.forEach((m) => {
    indicators.push({
      signalId: m.signalId || `RISK-MAT-${m.affectedFdrId}`,
      category: 'MATURITY_RENEWAL',
      severity: m.severity || RISK_LEVELS.MEDIUM,
      source: 'MATURITY_RISK_ENGINE',
      affectedRecord: m.fdrNumber || m.affectedFdrId,
      explanation: m.explanation,
      recommendedAction: m.recommendedAction,
      reviewStatus: 'PENDING_OFFICER_REVIEW',
    });
  });

  // 3. Document Intelligence Findings
  documentFindings.forEach((d) => {
    indicators.push({
      signalId: d.signalId || `RISK-DOC-${d.fdrId}`,
      category: 'DOCUMENT_INTELLIGENCE',
      severity: d.severity || RISK_LEVELS.MEDIUM,
      source: d.source || 'DOCUMENT_RISK_ADAPTER',
      affectedRecord: d.fdrNumber || d.fdrId,
      explanation: d.explanation,
      recommendedAction: d.isConfirmedDiscrepancy
        ? 'Officer-confirmed discrepancy — require physical FDR re-verification.'
        : 'Review extracted OCR values against declared fields in Intelligence Dossier.',
      reviewStatus: d.reviewStatus || 'UNREVIEWED',
      dossierLink: d.dossierLink,
    });
  });

  // 4. Simulated Bank Signals (STRICTLY labeled simulated)
  bankSimulationFindings.forEach((b) => {
    // Only add non-informational bank findings as risk indicators
    if (b.signalType !== 'SIMULATED_EXACT_MATCH') {
      indicators.push({
        signalId: b.signalId,
        category: 'BANK_SIMULATION_EVIDENCE',
        severity: b.severity || RISK_LEVELS.MEDIUM,
        source: 'BANK_EVIDENCE_ADAPTER (SIMULATED)',
        affectedRecord: b.signalId,
        isSimulated: true,
        explanation: `[SIMULATED] ${b.explanation}`,
        recommendedAction: b.recommendedAction,
        reviewStatus: 'SIMULATED_EVIDENCE',
      });
    }
  });

  // 5. Evaluate Overall Priority Level
  // Deterministic rule: CRITICAL is reserved for combination of serious issues:
  // e.g. Shortfall + Expired FDR OR Shortfall + Confirmed Discrepancy
  const hasShortfall = indicators.some((i) => i.signalId === 'RISK-ADEQUACY-SHORTFALL');
  const hasMaturedNoRenewal = maturityFindings.some((m) => m.riskType === 'FDR_MATURED');
  const hasConfirmedDiscrepancy = documentFindings.some((d) => d.isConfirmedDiscrepancy);

  let overallPriority = RISK_LEVELS.INFORMATIONAL;

  if (hasShortfall && (hasMaturedNoRenewal || hasConfirmedDiscrepancy)) {
    overallPriority = RISK_LEVELS.CRITICAL;
  } else {
    // Take max severity present in indicators
    let maxWeight = 0;
    indicators.forEach((ind) => {
      const weight = SEVERITY_WEIGHTS[ind.severity] || 0;
      if (weight > maxWeight) {
        maxWeight = weight;
        overallPriority = ind.severity;
      }
    });
  }

  // Group counts
  const countsBySeverity = {
    [RISK_LEVELS.CRITICAL]: indicators.filter((i) => i.severity === RISK_LEVELS.CRITICAL).length,
    [RISK_LEVELS.HIGH]: indicators.filter((i) => i.severity === RISK_LEVELS.HIGH).length,
    [RISK_LEVELS.MEDIUM]: indicators.filter((i) => i.severity === RISK_LEVELS.MEDIUM).length,
    [RISK_LEVELS.LOW]: indicators.filter((i) => i.severity === RISK_LEVELS.LOW).length,
    [RISK_LEVELS.INFORMATIONAL]: indicators.filter((i) => i.severity === RISK_LEVELS.INFORMATIONAL).length,
  };

  return {
    overallPriority,
    totalIndicators: indicators.length,
    countsBySeverity,
    indicators,
    methodology: 'Deterministic categorical risk synthesis — no black-box machine learning probability scores.',
  };
}
