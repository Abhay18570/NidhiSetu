/**
 * NidhiSetu Storage — Compliance Review Repository
 * Tracks officer adjudications, decisions, and dismissal justifications
 * on compliance assessment snapshots and risk indicators.
 */

import { storageService, STORAGE_KEYS } from './storageService';
import { auditRepository } from './auditRepository';

export const COMPLIANCE_REVIEW_DECISIONS = {
  APPROVED_COMPLIANT: 'APPROVED_COMPLIANT',
  FLAGGED_NON_COMPLIANT: 'FLAGGED_NON_COMPLIANT',
  CONDITIONAL_CLEARANCE: 'CONDITIONAL_CLEARANCE',
  CASE_REFERRED: 'CASE_REFERRED',
};

export const complianceReviewRepository = {
  /**
   * Retrieves all compliance reviews
   */
  async getAllReviews() {
    const list = storageService.getItem(STORAGE_KEYS.COMPLIANCE_REVIEWS, []);
    return Array.isArray(list) ? list : [];
  },

  /**
   * Retrieves reviews for an assessment ID
   */
  async getReviewsByAssessmentId(assessmentId) {
    if (!assessmentId) return [];
    const all = await this.getAllReviews();
    return all.filter((r) => r.assessmentId === assessmentId);
  },

  /**
   * Records an officer compliance review decision on an assessment
   */
  async recordAssessmentReview({
    assessmentId,
    officerId = 'officer-user',
    decision,
    justificationReason,
    notes = '',
  }) {
    if (!assessmentId) throw new Error('assessmentId is required.');
    if (!decision || !Object.values(COMPLIANCE_REVIEW_DECISIONS).includes(decision)) {
      throw new Error(`Valid decision is required (${Object.values(COMPLIANCE_REVIEW_DECISIONS).join(', ')}).`);
    }
    if (!justificationReason || justificationReason.trim().length < 5) {
      throw new Error('A substantive justification reason (at least 5 characters) is mandatory.');
    }

    const now = new Date().toISOString();
    const reviewRecord = {
      reviewId: `REV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      assessmentId,
      officerId,
      decision,
      justificationReason: justificationReason.trim(),
      notes: notes.trim(),
      createdAt: now,
      updatedAt: now,
    };

    const all = await this.getAllReviews();
    all.unshift(reviewRecord);
    storageService.setItem(STORAGE_KEYS.COMPLIANCE_REVIEWS, all);

    await auditRepository.logEvent({
      eventType: 'COMPLIANCE_ASSESSMENT_REVIEWED',
      actorId: officerId,
      actorRole: 'officer',
      targetEntityId: assessmentId,
      summary: `Officer recorded compliance determination: ${decision} (${justificationReason.trim()})`,
      metadata: { decision, reviewId: reviewRecord.reviewId },
    });

    return reviewRecord;
  },

  /**
   * Records dismissal of a specific risk indicator on an assessment with required rationale
   */
  async dismissRiskSignal({
    assessmentId,
    signalId,
    officerId = 'officer-user',
    dismissalRationale,
  }) {
    if (!assessmentId || !signalId) throw new Error('assessmentId and signalId are required.');
    if (!dismissalRationale || dismissalRationale.trim().length < 5) {
      throw new Error('A substantive dismissal rationale (at least 5 characters) is required.');
    }

    const now = new Date().toISOString();
    const dismissalRecord = {
      dismissalId: `DISM-${Date.now()}`,
      assessmentId,
      signalId,
      officerId,
      dismissalRationale: dismissalRationale.trim(),
      dismissedAt: now,
    };

    const all = await this.getAllReviews();
    all.unshift(dismissalRecord);
    storageService.setItem(STORAGE_KEYS.COMPLIANCE_REVIEWS, all);

    await auditRepository.logEvent({
      eventType: 'COMPLIANCE_SIGNAL_DISMISSED',
      actorId: officerId,
      actorRole: 'officer',
      targetEntityId: `${assessmentId}#${signalId}`,
      summary: `Officer dismissed risk signal ${signalId}: ${dismissalRationale.trim()}`,
      metadata: { signalId, assessmentId },
    });

    return dismissalRecord;
  },

  /**
   * Clears reviews (for test / demo reset)
   */
  async clearAllReviews() {
    storageService.removeItem(STORAGE_KEYS.COMPLIANCE_REVIEWS);
  },
};
