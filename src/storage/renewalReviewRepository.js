/**
 * NidhiSetu Storage — Renewal Review Repository
 * Persists immutable officer review logs, adjudication rationales, and regulatory findings.
 */

import { storageService, STORAGE_KEYS } from './storageService';
import { auditRepository } from './auditRepository';

export const renewalReviewRepository = {
  /**
   * Retrieves all renewal reviews
   */
  async getAllReviews() {
    const list = storageService.getItem(STORAGE_KEYS.RENEWAL_REVIEWS, []);
    return Array.isArray(list) ? list : [];
  },

  /**
   * Retrieves reviews for a specific renewal request
   */
  async getReviewsByRequestId(renewalRequestId) {
    if (!renewalRequestId) return [];
    const all = await this.getAllReviews();
    return all
      .filter((r) => r.renewalRequestId === renewalRequestId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  /**
   * Records a formal officer renewal review decision
   */
  async recordReview({
    renewalRequestId,
    officerId = 'officer-user',
    decision,
    justificationReason,
    continuityAssessmentSnapshot = null,
    simulatedLienSnapshot = null,
  }) {
    if (!renewalRequestId) throw new Error('renewalRequestId is required.');
    if (!decision) throw new Error('Review decision is required.');
    if (!justificationReason || justificationReason.trim().length < 5) {
      throw new Error('Mandatory substantive justification (min 5 characters) is required for officer renewal reviews.');
    }

    const now = new Date().toISOString();
    const reviewId = `REV-RNL-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newReview = {
      reviewId,
      renewalRequestId,
      officerId,
      decision,
      justificationReason: justificationReason.trim(),
      continuityAssessmentSnapshot,
      simulatedLienSnapshot,
      createdAt: now,
    };

    const all = await this.getAllReviews();
    all.unshift(newReview);
    storageService.setItem(STORAGE_KEYS.RENEWAL_REVIEWS, all);

    await auditRepository.logEvent({
      eventType: 'RENEWAL_OFFICER_REVIEW_RECORDED',
      actorId: officerId,
      actorRole: 'officer',
      targetEntityId: renewalRequestId,
      summary: `Officer recorded decision ${decision} for renewal request ${renewalRequestId}`,
      metadata: { reviewId, decision, justificationReason },
    });

    return newReview;
  },
};
