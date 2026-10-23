/**
 * NidhiSetu Compliance Rule Model
 * Defines schemas, statuses, validation logic, and conflict detection
 * for regulatory deposit requirements.
 *
 * DISCLAIMER: Prototype demonstration model — not an official regulatory determination.
 */

export const RULE_STATUSES = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  RETIRED: 'RETIRED',
};

export const REGULATORY_AUTHORITIES = {
  AICTE: 'AICTE',
  UGC: 'UGC',
  DTE: 'DTE',
  STATE_GOVT: 'STATE_GOVT',
  OTHER: 'OTHER',
};

export const INSTITUTION_CATEGORIES = {
  ENGINEERING: 'ENGINEERING',
  MANAGEMENT: 'MANAGEMENT',
  PHARMACY: 'PHARMACY',
  ARCHITECTURE: 'ARCHITECTURE',
  POLYTECHNIC: 'POLYTECHNIC',
  GENERAL: 'GENERAL',
  ALL: 'ALL',
};

export const PROGRAM_CATEGORIES = {
  UNDERGRADUATE: 'UNDERGRADUATE',
  POSTGRADUATE: 'POSTGRADUATE',
  DIPLOMA: 'DIPLOMA',
  INTEGRATED: 'INTEGRATED',
  ALL: 'ALL',
};

/**
 * Validates a compliance rule object.
 * Returns { valid: boolean, errors: string[] }
 */
export function validateComplianceRule(rule) {
  const errors = [];

  if (!rule) {
    return { valid: false, errors: ['Rule object is required'] };
  }

  if (!rule.ruleCode || typeof rule.ruleCode !== 'string' || rule.ruleCode.trim().length === 0) {
    errors.push('Rule code is required');
  }

  if (!rule.title || typeof rule.title !== 'string' || rule.title.trim().length === 0) {
    errors.push('Rule title is required');
  }

  if (!rule.regulatoryAuthority) {
    errors.push('Regulatory authority is required');
  }

  if (!rule.institutionCategory) {
    errors.push('Institution category is required');
  }

  if (!rule.programCategory) {
    errors.push('Program category is required');
  }

  // Minimum deposit in paise must be non-negative integer
  if (
    typeof rule.minimumDepositPaise !== 'number' ||
    rule.minimumDepositPaise < 0 ||
    !Number.isInteger(rule.minimumDepositPaise)
  ) {
    errors.push('Minimum deposit amount (in paise) must be a non-negative integer');
  }

  // Validity months must be positive integer
  if (
    typeof rule.requiredValidityMonths !== 'number' ||
    rule.requiredValidityMonths < 0 ||
    !Number.isInteger(rule.requiredValidityMonths)
  ) {
    errors.push('Required validity months must be a non-negative integer');
  }

  // Effective dates validation
  if (!rule.effectiveFrom) {
    errors.push('Effective from date is required');
  } else {
    const fromDate = new Date(rule.effectiveFrom);
    if (isNaN(fromDate.getTime())) {
      errors.push('Effective from date must be a valid date');
    }

    if (rule.effectiveTo) {
      const toDate = new Date(rule.effectiveTo);
      if (isNaN(toDate.getTime())) {
        errors.push('Effective to date must be a valid date');
      } else if (toDate < fromDate) {
        errors.push('Effective to date cannot be earlier than Effective from date');
      }
    }
  }

  // Status must be valid
  if (!Object.values(RULE_STATUSES).includes(rule.ruleStatus)) {
    errors.push(`Rule status must be one of: ${Object.values(RULE_STATUSES).join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Checks whether two active rules have overlapping applicability periods
 * and identical authority, category, and program scopes.
 */
export function areRulesConflicting(ruleA, ruleB) {
  if (!ruleA || !ruleB) return false;
  if (ruleA.ruleId === ruleB.ruleId) return false; // same rule
  // Neither rule can be RETIRED
  if (ruleA.ruleStatus === RULE_STATUSES.RETIRED || ruleB.ruleStatus === RULE_STATUSES.RETIRED) {
    return false;
  }

  // Compare scope
  const sameAuthority = ruleA.regulatoryAuthority === ruleB.regulatoryAuthority;
  const sameInstCat =
    ruleA.institutionCategory === ruleB.institutionCategory ||
    ruleA.institutionCategory === 'ALL' ||
    ruleB.institutionCategory === 'ALL';
  const sameProgCat =
    ruleA.programCategory === ruleB.programCategory ||
    ruleA.programCategory === 'ALL' ||
    ruleB.programCategory === 'ALL';

  if (!sameAuthority || !sameInstCat || !sameProgCat) {
    return false;
  }

  // Compare effective periods
  const aFrom = new Date(ruleA.effectiveFrom).getTime();
  const aTo = ruleA.effectiveTo ? new Date(ruleA.effectiveTo).getTime() : Infinity;
  const bFrom = new Date(ruleB.effectiveFrom).getTime();
  const bTo = ruleB.effectiveTo ? new Date(ruleB.effectiveTo).getTime() : Infinity;

  // Overlap condition: startA <= endB and startB <= endA
  const overlaps = aFrom <= bTo && bFrom <= aTo;
  return overlaps;
}

/**
 * Creates a default rule template
 */
export function createDefaultRule(overrides = {}) {
  const now = new Date().toISOString();
  return {
    ruleId: `RULE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    ruleCode: 'RULE-STD-001',
    title: 'Standard Security Deposit Requirement',
    description: 'Configured security deposit requirement for regulatory compliance verification.',
    regulatoryAuthority: REGULATORY_AUTHORITIES.AICTE,
    institutionCategory: INSTITUTION_CATEGORIES.ENGINEERING,
    programCategory: PROGRAM_CATEGORIES.UNDERGRADUATE,
    applicabilityConditions: {
      minIntake: 0,
      description: 'Applicable to technical undergraduate programs',
    },
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: null,
    minimumDepositPaise: 350000000, // ₹35,00,000 in paise
    requiredValidityMonths: 60, // 5 years
    maturityWarningDays: 90,
    renewalLeadDays: 60,
    lienRequired: true,
    expectedLienBeneficiary: 'MEMBER SECRETARY AICTE',
    ruleVersion: 1,
    ruleStatus: RULE_STATUSES.DRAFT,
    sourceReference: 'AICTE Approval Process Handbook (Synthetic Prototype Specification)',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
