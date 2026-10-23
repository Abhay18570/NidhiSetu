/**
 * NidhiSetu Document Intelligence — Exact Duplicate Detection Engine
 * Uses deterministic SHA-256 document cryptographic hashes to detect document reuse
 * across FDR records, renewal chains, and cross-institution submissions.
 *
 * NOTE: Duplicate hashes are investigative signals and DO NOT prove fraudulent intent.
 */

import { FINDING_SEVERITY } from './analysisModel';

export const DUPLICATE_CLASSIFICATION = {
  NONE: 'NONE',
  INFORMATIONAL_DUPLICATE: 'INFORMATIONAL_DUPLICATE',
  CONTEXTUAL_RENEWAL: 'CONTEXTUAL_RENEWAL',
  INTERNAL_DUPLICATE: 'INTERNAL_DUPLICATE',
  CROSS_INSTITUTION_COLLISION: 'CROSS_INSTITUTION_COLLISION',
};

/**
 * Evaluates a document's SHA-256 fingerprint against all recorded FDR submissions.
 *
 * @param {string} targetSha256 - The SHA-256 hex digest of the document under analysis
 * @param {Object} currentFdr - The FDR record being analyzed
 * @param {Array<Object>} allFdrs - Collection of all FDR records in the system
 * @param {Object} options - Optional context flags (viewerRole, institutionId)
 * @returns {Object} Duplicate analysis outcome
 */
export function detectDuplicateFingerprint(targetSha256, currentFdr = {}, allFdrs = [], options = {}) {
  if (!targetSha256 || typeof targetSha256 !== 'string') {
    return {
      isDuplicate: false,
      classification: DUPLICATE_CLASSIFICATION.NONE,
      severity: FINDING_SEVERITY.INFO,
      matches: [],
      explanation: 'No document fingerprint provided for collision analysis.',
    };
  }

  const cleanHash = targetSha256.trim().toLowerCase();
  const currentFdrId = currentFdr?.id || null;
  const currentInstId = currentFdr?.institutionId || options.institutionId || null;
  const currentRenewalRef = currentFdr?.renewalReferenceId || null;

  // Find all other records that have the exact same SHA-256 fingerprint
  const matchingRecords = (allFdrs || []).filter((fdr) => {
    if (!fdr || fdr.id === currentFdrId) return false;
    const fdrHash = (fdr.sha256Hash || '').trim().toLowerCase();
    return fdrHash === cleanHash && cleanHash.length === 64;
  });

  if (matchingRecords.length === 0) {
    return {
      isDuplicate: false,
      classification: DUPLICATE_CLASSIFICATION.NONE,
      severity: FINDING_SEVERITY.INFO,
      matches: [],
      explanation: 'Unique document fingerprint. No collision detected in current registry.',
    };
  }

  // Classify collisions based on administrative context
  const crossInstitutionMatches = matchingRecords.filter(
    (rec) => rec.institutionId && currentInstId && rec.institutionId !== currentInstId
  );

  const renewalMatches = matchingRecords.filter((rec) => {
    // Check if current FDR points to this match as a renewal, or match points to current
    const isDirectRenewal =
      (currentRenewalRef && (rec.id === currentRenewalRef || rec.referenceNumber === currentRenewalRef)) ||
      (rec.renewalReferenceId && (rec.renewalReferenceId === currentFdrId || rec.renewalReferenceId === currentFdr?.referenceNumber));
    return isDirectRenewal;
  });

  const internalMatches = matchingRecords.filter((rec) => {
    return rec.institutionId === currentInstId && !renewalMatches.some((r) => r.id === rec.id);
  });

  // Prepare sanitized match references respecting role-based visibility
  const isOfficerOrAdmin = options.viewerRole === 'officer' || options.viewerRole === 'admin';

  const sanitizedMatches = matchingRecords.map((rec) => {
    const isSameInst = rec.institutionId === currentInstId;
    const canSeeDetails = isOfficerOrAdmin || isSameInst;

    return {
      fdrId: rec.id,
      referenceNumber: canSeeDetails ? rec.referenceNumber : 'CONFIDENTIAL_EXTERNAL_REF',
      institutionId: canSeeDetails ? rec.institutionId : 'EXTERNAL_INSTITUTION',
      institutionName: canSeeDetails ? rec.institutionName : 'Another Registered Institution',
      status: rec.status,
      uploadedAt: rec.uploadedAt,
      isRenewalRelation: renewalMatches.some((r) => r.id === rec.id),
      isSameInstitution: isSameInst,
    };
  });

  // Determine highest-priority classification
  if (crossInstitutionMatches.length > 0) {
    return {
      isDuplicate: true,
      classification: DUPLICATE_CLASSIFICATION.CROSS_INSTITUTION_COLLISION,
      severity: FINDING_SEVERITY.HIGH,
      matches: sanitizedMatches,
      collisionCount: matchingRecords.length,
      explanation:
        'Exact document fingerprint collision detected with a submission from a different institution. Requires officer review.',
      recommendedAction:
        'Conduct cross-institutional document verification to establish whether the physical certificate was inadvertently duplicated or improperly reused.',
    };
  }

  if (renewalMatches.length > 0) {
    return {
      isDuplicate: true,
      classification: DUPLICATE_CLASSIFICATION.CONTEXTUAL_RENEWAL,
      severity: FINDING_SEVERITY.INFO,
      matches: sanitizedMatches,
      collisionCount: matchingRecords.length,
      explanation:
        'Document fingerprint matches a linked renewal record in this institution’s historical lifecycle chain.',
      recommendedAction:
        'Verify that the scanned receipt reflects an extended validity endorsement or an identical continuing deposit instrument.',
    };
  }

  if (internalMatches.length > 0) {
    return {
      isDuplicate: true,
      classification: DUPLICATE_CLASSIFICATION.INTERNAL_DUPLICATE,
      severity: FINDING_SEVERITY.MEDIUM,
      matches: sanitizedMatches,
      collisionCount: matchingRecords.length,
      explanation:
        'Identical document fingerprint was previously uploaded under a separate FDR reference by this same institution.',
      recommendedAction:
        'Confirm whether this is an accidental duplicate submission or a legitimate amendment of an earlier draft.',
    };
  }

  return {
    isDuplicate: true,
    classification: DUPLICATE_CLASSIFICATION.INFORMATIONAL_DUPLICATE,
    severity: FINDING_SEVERITY.LOW,
    matches: sanitizedMatches,
    collisionCount: matchingRecords.length,
    explanation: 'Document fingerprint matches an existing entry in the repository.',
    recommendedAction: 'Verify document attachments.',
  };
}
