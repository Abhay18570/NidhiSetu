/**
 * NidhiSetu Synthetic Demonstration Compliance Rules & Fixtures
 *
 * IMPORTANT DISCLAIMER:
 * These rules, amounts, and scenarios are synthetic demonstration fixtures
 * for the prototype system and DO NOT represent official regulatory determinations,
 * legal obligations, or actual AICTE/UGC statutory regulations.
 */

import { RULE_STATUSES, REGULATORY_AUTHORITIES, INSTITUTION_CATEGORIES, PROGRAM_CATEGORIES } from './complianceRuleModel';

export const PROTOTYPE_COMPLIANCE_DISCLAIMER =
  'Prototype Compliance Assessment — Not an Official Regulatory Determination. Evaluated using configured demonstration rules.';

export const SIMULATED_BANK_DISCLAIMER =
  'Bank Evidence Is Simulated — No Real Bank Confirmation Performed.';

export const SYNTHETIC_DEMO_RULES = [
  {
    ruleId: 'RULE-AICTE-ENG-UG-2024',
    ruleCode: 'AICTE-ENG-UG-V1',
    title: 'AICTE Technical Engineering (UG) Security Deposit Requirement',
    description: 'Mandatory joint fixed deposit requirement for AICTE approved undergraduate technical engineering colleges.',
    regulatoryAuthority: REGULATORY_AUTHORITIES.AICTE,
    institutionCategory: INSTITUTION_CATEGORIES.ENGINEERING,
    programCategory: PROGRAM_CATEGORIES.UNDERGRADUATE,
    applicabilityConditions: {
      type: 'TECHNICAL_DEGREE',
      minIntake: 60,
    },
    effectiveFrom: '2023-01-01',
    effectiveTo: '2027-12-31',
    minimumDepositPaise: 350000000, // ₹35,00,000
    requiredValidityMonths: 60, // 5 years
    maturityWarningDays: 90,
    renewalLeadDays: 60,
    lienRequired: true,
    expectedLienBeneficiary: 'MEMBER SECRETARY AICTE NEW DELHI',
    ruleVersion: 1,
    ruleStatus: RULE_STATUSES.ACTIVE,
    sourceReference: 'AICTE Approval Process Handbook (Synthetic Demonstration Specification 2023-27)',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
  {
    ruleId: 'RULE-AICTE-MGMT-PG-2024',
    ruleCode: 'AICTE-MGMT-PG-V1',
    title: 'AICTE Management Studies (PG/MBA) Security Deposit Requirement',
    description: 'Mandatory joint security deposit for postgraduate management and business administration institutes.',
    regulatoryAuthority: REGULATORY_AUTHORITIES.AICTE,
    institutionCategory: INSTITUTION_CATEGORIES.MANAGEMENT,
    programCategory: PROGRAM_CATEGORIES.POSTGRADUATE,
    applicabilityConditions: {
      type: 'MANAGEMENT_POSTGRADUATE',
      minIntake: 60,
    },
    effectiveFrom: '2023-01-01',
    effectiveTo: '2027-12-31',
    minimumDepositPaise: 150000000, // ₹15,00,000
    requiredValidityMonths: 36, // 3 years
    maturityWarningDays: 90,
    renewalLeadDays: 45,
    lienRequired: true,
    expectedLienBeneficiary: 'MEMBER SECRETARY AICTE NEW DELHI',
    ruleVersion: 1,
    ruleStatus: RULE_STATUSES.ACTIVE,
    sourceReference: 'AICTE Approval Process Handbook (Synthetic Demonstration Specification 2023-27)',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
  {
    ruleId: 'RULE-AICTE-PHARM-2024',
    ruleCode: 'AICTE-PHARM-UG-V1',
    title: 'Pharmacy Institute Standard Security Deposit (UG)',
    description: 'Security deposit requirement for undergraduate Bachelor of Pharmacy institutions.',
    regulatoryAuthority: REGULATORY_AUTHORITIES.AICTE,
    institutionCategory: INSTITUTION_CATEGORIES.PHARMACY,
    programCategory: PROGRAM_CATEGORIES.UNDERGRADUATE,
    applicabilityConditions: {
      type: 'PHARMACY_DEGREE',
    },
    effectiveFrom: '2023-01-01',
    effectiveTo: null,
    minimumDepositPaise: 250000000, // ₹25,00,000
    requiredValidityMonths: 60,
    maturityWarningDays: 90,
    renewalLeadDays: 60,
    lienRequired: true,
    expectedLienBeneficiary: 'MEMBER SECRETARY AICTE NEW DELHI',
    ruleVersion: 1,
    ruleStatus: RULE_STATUSES.ACTIVE,
    sourceReference: 'AICTE Synthetic Pharmacy Benchmark (Prototype Spec)',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
  {
    ruleId: 'RULE-DTE-POLY-DIP-2024',
    ruleCode: 'DTE-POLY-DIP-V1',
    title: 'State Technical Education Polytechnic Diploma Deposit Requirement',
    description: 'Security deposit requirement for state-approved technical diploma polytechnic institutes.',
    regulatoryAuthority: REGULATORY_AUTHORITIES.DTE,
    institutionCategory: INSTITUTION_CATEGORIES.POLYTECHNIC,
    programCategory: PROGRAM_CATEGORIES.DIPLOMA,
    applicabilityConditions: {
      type: 'POLYTECHNIC_DIPLOMA',
    },
    effectiveFrom: '2022-06-01',
    effectiveTo: null,
    minimumDepositPaise: 100000000, // ₹10,00,000
    requiredValidityMonths: 36,
    maturityWarningDays: 60,
    renewalLeadDays: 30,
    lienRequired: true,
    expectedLienBeneficiary: 'DIRECTOR TECHNICAL EDUCATION',
    ruleVersion: 1,
    ruleStatus: RULE_STATUSES.ACTIVE,
    sourceReference: 'State DTE Norms Manual (Prototype Synthetic Reference)',
    createdAt: '2022-06-01T00:00:00.000Z',
    updatedAt: '2022-06-01T00:00:00.000Z',
  },
  {
    ruleId: 'RULE-DRAFT-SAMPLE-2025',
    ruleCode: 'AICTE-FUTURE-DRAFT',
    title: 'Proposed AICTE Multi-Disciplinary Complex Deposit (Draft)',
    description: 'Draft regulatory framework under consideration for multi-disciplinary institutes.',
    regulatoryAuthority: REGULATORY_AUTHORITIES.AICTE,
    institutionCategory: INSTITUTION_CATEGORIES.ALL,
    programCategory: PROGRAM_CATEGORIES.ALL,
    applicabilityConditions: {
      minIntake: 240,
    },
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    minimumDepositPaise: 500000000, // ₹50,00,000
    requiredValidityMonths: 120, // 10 years
    maturityWarningDays: 120,
    renewalLeadDays: 90,
    lienRequired: true,
    expectedLienBeneficiary: 'MEMBER SECRETARY AICTE NEW DELHI',
    ruleVersion: 1,
    ruleStatus: RULE_STATUSES.DRAFT,
    sourceReference: 'Working Draft Concept Note 2025 (Prototype)',
    createdAt: '2024-10-01T00:00:00.000Z',
    updatedAt: '2024-10-01T00:00:00.000Z',
  },
];
