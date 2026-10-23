/**
 * NidhiSetu Storage — Bank Review Repository
 * Records officer actions, discrepancies disposition, notes, and closure decisions on banking verifications.
 */

import { storageService, STORAGE_KEYS } from './storageService';
import { auditRepository } from './auditRepository';
import { generateUUID } from '../banking/bankMessageSchema';

export const REVIEW_ACTIONS = {
  START_REVIEW: 'START_REVIEW',
  ADD_NOTE: 'ADD_NOTE',
  MARK_CONSISTENT: 'MARK_CONSISTENT',
  REQUEST_FOLLOW_UP: 'REQUEST_FOLLOW_UP',
  CLOSE_REVIEW: 'CLOSE_REVIEW',
  REOPEN_REVIEW: 'REOPEN_REVIEW',
};

export const bankReviewRepository = {
  /**
   * Retrieves all review actions
   */
  async getAllReviews() {
    const list = storageService.getItem(STORAGE_KEYS.BANK_REVIEWS, []);
    return Array.isArray(list) ? list : [];
  },

  /**
   * Retrieves reviews for a specific request ID
   */
  async getReviewsByRequestId(requestId) {
    if (!requestId) return [];
    const all = await this.getAllReviews();
    return all.filter((r) => r.requestId === requestId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  /**
   * Adds an officer review action with validation
   */
  async recordReviewAction({
    requestId,
    fdrId,
    officerId,
    reviewAction,
    reason = '',
    notes = '',
  }) {
    if (!requestId) {
      throw new Error('Mandatory field missing: requestId');
    }
    if (!officerId) {
      throw new Error('Mandatory field missing: officerId');
    }
    if (!reviewAction || !REVIEW_ACTIONS[reviewAction]) {
      throw new Error(`Invalid reviewAction: ${reviewAction}`);
    }

    // Require reason for follow up and close actions
    if (
      (reviewAction === REVIEW_ACTIONS.REQUEST_FOLLOW_UP || reviewAction === REVIEW_ACTIONS.CLOSE_REVIEW) &&
      (!reason || reason.trim().length < 5)
    ) {
      throw new Error(`A substantive justification (minimum 5 characters) is mandatory for ${reviewAction}.`);
    }

    const reviewEntry = {
      reviewId: `REV-${generateUUID().substring(0, 8).toUpperCase()}`,
      requestId,
      fdrId: fdrId || null,
      officerId,
      reviewAction,
      reason: reason ? reason.trim() : null,
      notes: notes ? notes.trim() : null,
      createdAt: new Date().toISOString(),
    };

    const all = await this.getAllReviews();
    all.push(reviewEntry);
    storageService.setItem(STORAGE_KEYS.BANK_REVIEWS, all);

    // Audit log
    await auditRepository.logEvent({
      eventType: `BANK_VERIFICATION_REVIEW_${reviewAction}`,
      actorId: officerId,
      actorRole: 'OFFICER',
      targetEntityId: requestId,
      summary: `Officer recorded review action: ${reviewAction}`,
      metadata: {
        fdrId,
        reviewAction,
        reason: reviewEntry.reason,
      },
    });

    return reviewEntry;
  },

  /**
   * Clears reviews (demo reset)
   */
  async clearAll() {
    storageService.setItem(STORAGE_KEYS.BANK_REVIEWS, []);
    return true;
  },
};
