/**
 * NidhiSetu Document Intelligence — Domain Constants & Data Models
 * Standardized schema definitions for OCR text extraction, cross-field validation,
 * explainable anomaly detection, and officer review workflows.
 */

export const ANALYSIS_VERSION = '1.0.0-PROTOTYPE';
export const EXTRACTION_VERSION = '1.0.0';

export const COMPARISON_RESULT = {
  MATCH: 'MATCH',
  MISMATCH: 'MISMATCH',
  MISSING_IN_DOCUMENT: 'MISSING_IN_DOCUMENT',
  MISSING_IN_SUBMISSION: 'MISSING_IN_SUBMISSION',
  AMBIGUOUS: 'AMBIGUOUS',
  NOT_ANALYZED: 'NOT_ANALYZED',
};

export const FINDING_SEVERITY = {
  INFO: 'INFO',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
};

export const FINDING_TYPE = {
  AMOUNT_MISMATCH: 'AMOUNT_MISMATCH',
  MATURITY_DATE_MISMATCH: 'MATURITY_DATE_MISMATCH',
  DEPOSIT_DATE_MISMATCH: 'DEPOSIT_DATE_MISMATCH',
  IFSC_MISMATCH: 'IFSC_MISMATCH',
  FDR_NUMBER_MISMATCH: 'FDR_NUMBER_MISMATCH',
  ACCOUNT_HOLDER_MISMATCH: 'ACCOUNT_HOLDER_MISMATCH',
  MISSING_CRITICAL_FIELD: 'MISSING_CRITICAL_FIELD',
  DUPLICATE_DOCUMENT_FINGERPRINT: 'DUPLICATE_DOCUMENT_FINGERPRINT',
  INCONSISTENT_DATE_SEQUENCE: 'INCONSISTENT_DATE_SEQUENCE',
  UNREADABLE_OR_PARTIAL_TEXT: 'UNREADABLE_OR_PARTIAL_TEXT',
};

export const ANALYSIS_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  STALE: 'STALE',
};

export const REVIEW_STATUS = {
  OPEN: 'OPEN',
  UNDER_REVIEW: 'UNDER_REVIEW',
  CONFIRMED_DISCREPANCY: 'CONFIRMED_DISCREPANCY',
  DISMISSED: 'DISMISSED',
  RESOLVED: 'RESOLVED',
};

export const SCORECARD_LABEL = {
  NO_DISCREPANCY: 'NO_DISCREPANCY',
  REVIEW_RECOMMENDED: 'REVIEW_RECOMMENDED',
  INCOMPLETE_EXTRACTION: 'INCOMPLETE_EXTRACTION',
  HIGH_PRIORITY_DISCREPANCY: 'HIGH_PRIORITY_DISCREPANCY',
};

/**
 * Standard fields analyzed across submitted FDR metadata and document text
 */
export const ANALYZABLE_FIELDS = [
  { key: 'bankName', label: 'Issuing Bank Name', critical: true },
  { key: 'ifsc', label: 'Branch IFSC Code', critical: true },
  { key: 'fdrNumber', label: 'FDR Certificate Number', critical: true },
  { key: 'depositAmount', label: 'Deposit Principal Amount', critical: true },
  { key: 'depositDate', label: 'Deposit Issue Date', critical: true },
  { key: 'maturityDate', label: 'Maturity Date', critical: true },
  { key: 'accountHolderName', label: 'Joint Account Holder Name', critical: false },
  { key: 'interestRate', label: 'Interest Rate (% p.a.)', critical: false },
  { key: 'branchName', label: 'Branch Name', critical: false },
];
