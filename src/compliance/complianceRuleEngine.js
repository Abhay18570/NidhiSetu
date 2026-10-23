/**
 * NidhiSetu Compliance Rule Engine
 * Deterministically resolves the applicable regulatory deposit rule for an institution
 * based on authority, institution category, program category, and effective dates.
 *
 * Handles:
 * - MATCH_FOUND: exactly one active rule matches
 * - REQUIREMENT_NOT_CONFIGURED: no active rule matches
 * - AMBIGUOUS_RULE_SELECTION: multiple active rules match with overlapping applicability
 */

import { RULE_STATUSES } from './complianceRuleModel';

/**
 * Resolves the applicable rule for a given institution profile and assessment date.
 *
 * @param {Object} institution - Institution record { institutionId, category, institutionType, programs, ... }
 * @param {Array} allRules - List of all configured compliance rules
 * @param {string|Date} assessmentDate - Reference evaluation date (default: today)
 * @returns {Object} Resolution result
 */
export function resolveApplicableRule(institution, allRules = [], assessmentDate = new Date()) {
  if (!institution) {
    return {
      status: 'REQUIREMENT_NOT_CONFIGURED',
      rule: null,
      reason: 'Institution record missing',
    };
  }

  const evalDate = new Date(assessmentDate).getTime();
  const instCategory = (institution.category || institution.institutionType || 'ENGINEERING').toUpperCase();
  const progCategory = (institution.programCategory || 'UNDERGRADUATE').toUpperCase();

  // Filter rules that are ACTIVE and valid on assessmentDate
  const activeRules = allRules.filter((r) => {
    if (r.ruleStatus !== RULE_STATUSES.ACTIVE) return false;

    const fromTime = new Date(r.effectiveFrom).getTime();
    const toTime = r.effectiveTo ? new Date(r.effectiveTo).getTime() : Infinity;

    return evalDate >= fromTime && evalDate <= toTime;
  });

  // Filter matching category and program
  const matchedRules = activeRules.filter((r) => {
    const matchCategory =
      r.institutionCategory === 'ALL' ||
      r.institutionCategory.toUpperCase() === instCategory ||
      instCategory.includes(r.institutionCategory.toUpperCase());

    const matchProgram =
      r.programCategory === 'ALL' ||
      r.programCategory.toUpperCase() === progCategory ||
      progCategory.includes(r.programCategory.toUpperCase());

    return matchCategory && matchProgram;
  });

  if (matchedRules.length === 0) {
    return {
      status: 'REQUIREMENT_NOT_CONFIGURED',
      rule: null,
      reason: `No active regulatory rule configured for category "${instCategory}" / program "${progCategory}" as of ${new Date(evalDate).toISOString().split('T')[0]}.`,
    };
  }

  if (matchedRules.length === 1) {
    return {
      status: 'MATCH_FOUND',
      rule: matchedRules[0],
    };
  }

  // Check if one rule is more specific than another (specific category vs 'ALL')
  const specificRules = matchedRules.filter(
    (r) => r.institutionCategory !== 'ALL' && r.programCategory !== 'ALL'
  );

  if (specificRules.length === 1) {
    return {
      status: 'MATCH_FOUND',
      rule: specificRules[0],
    };
  }

  // Otherwise, ambiguous rule selection requiring administrator resolution
  return {
    status: 'AMBIGUOUS_RULE_SELECTION',
    rule: null,
    conflictingRules: matchedRules,
    reason: `Multiple active rules (${matchedRules.map((r) => r.ruleCode || r.ruleId).join(', ')}) match institution criteria without explicit deterministic precedence. Administrator resolution required.`,
  };
}
