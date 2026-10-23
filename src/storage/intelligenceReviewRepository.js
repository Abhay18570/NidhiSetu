/**
 * NidhiSetu Storage — Intelligence Review Repository
 * Manages human officer reviews, lifecycle transitions, explanatory notes,
 * and mandatory resolution/dismissal rationale for document intelligence findings.
 *
 * NOTE: Intelligence finding reviews are strictly separate from Module 03 administrative approvals.
 * CONFIRMED_DISCREPANCY indicates an identified documentary variance, NOT legal fraud.
 */

import { storageService, STORAGE_KEYS } from './storageService';
import { REVIEW_STATUS } from '../intelligence/analysisModel';

export const intelligenceReviewRepository = {
  /**
   * Retrieves all finding reviews from storage
   */
  async getAllReviews() {
    const list = storageService.getItem(STORAGE_KEYS.INTELLIGENCE_REVIEWS, []);
    return Array.isArray(list) ? list : [];
  },

  /**
   * Retrieves the review record for a specific finding ID
   */
  async getReviewByFindingId(findingId) {
    if (!findingId) return null;
    const all = await this.getAllReviews();
    return all.find((r) => r.findingId === findingId) || null;
  },

  /**
   * Retrieves all reviews associated with a specific FDR ID
   */
  async getReviewsByFdrId(fdrId) {
    if (!fdrId) return [];
    const all = await this.getAllReviews();
    return all.filter((r) => r.fdrId === fdrId);
  },

  /**
   * Internal helper to upsert or update a review entry
   */
  async _saveReview(review) {
    const all = await this.getAllReviews();
    const idx = all.findIndex((r) => r.findingId === review.findingId);
    let updated;
    if (idx >= 0) {
      updated = [...all];
      updated[idx] = { ...review, updatedAt: new Date().toISOString() };
    } else {
      updated = [review, ...all];
    }
    storageService.setItem(STORAGE_KEYS.INTELLIGENCE_REVIEWS, updated);
    return review;
  },

  /**
   * Creates or gets a review record for a finding
   */
  async getOrCreateReview(findingId, analysisId, fdrId) {
    let review = await this.getReviewByFindingId(findingId);
    if (!review) {
      const now = new Date().toISOString();
      review = {
        reviewId: `rev-${findingId}`,
        findingId,
        analysisId: analysisId || null,
        fdrId: fdrId || null,
        status: REVIEW_STATUS.OPEN,
        assignedOfficerId: null,
        assignedOfficerName: null,
        reason: null,
        notes: [],
        history: [
          {
            action: 'CREATED',
            fromStatus: null,
            toStatus: REVIEW_STATUS.OPEN,
            actorId: 'system',
            actorName: 'Intelligence Engine',
            reason: 'Automated finding registered.',
            timestamp: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      };
      await this._saveReview(review);
    }
    return review;
  },

  /**
   * Officer starts human review on a finding
   */
  async startReview(findingId, analysisId, fdrId, actor = {}) {
    const review = await this.getOrCreateReview(findingId, analysisId, fdrId);
    const prevStatus = review.status;
    const now = new Date().toISOString();

    review.status = REVIEW_STATUS.UNDER_REVIEW;
    review.assignedOfficerId = actor.id || 'officer';
    review.assignedOfficerName = actor.name || 'Regulatory Scrutiny Officer';

    review.history.push({
      action: 'STARTED_REVIEW',
      fromStatus: prevStatus,
      toStatus: REVIEW_STATUS.UNDER_REVIEW,
      actorId: actor.id || 'officer',
      actorName: actor.name || 'Regulatory Scrutiny Officer',
      reason: 'Officer initiated manual verification of finding.',
      timestamp: now,
    });

    return await this._saveReview(review);
  },

  /**
   * Officer confirms the discrepancy between submitted data and document
   */
  async confirmDiscrepancy(findingId, reason = '', actor = {}) {
    const review = await this.getOrCreateReview(findingId);
    const prevStatus = review.status;
    const now = new Date().toISOString();

    review.status = REVIEW_STATUS.CONFIRMED_DISCREPANCY;
    review.reason = reason ? reason.trim() : 'Officer confirmed discrepancy between document and submission.';

    review.history.push({
      action: 'CONFIRMED_DISCREPANCY',
      fromStatus: prevStatus,
      toStatus: REVIEW_STATUS.CONFIRMED_DISCREPANCY,
      actorId: actor.id || 'officer',
      actorName: actor.name || 'Officer',
      reason: review.reason,
      timestamp: now,
    });

    return await this._saveReview(review);
  },

  /**
   * Officer dismisses a finding. A MANDATORY explanation reason is required.
   */
  async dismissFinding(findingId, reason, actor = {}) {
    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      throw new Error('A detailed reason (at least 5 characters) is mandatory to dismiss a discrepancy finding.');
    }

    const review = await this.getOrCreateReview(findingId);
    const prevStatus = review.status;
    const now = new Date().toISOString();

    review.status = REVIEW_STATUS.DISMISSED;
    review.reason = reason.trim();

    review.history.push({
      action: 'DISMISSED',
      fromStatus: prevStatus,
      toStatus: REVIEW_STATUS.DISMISSED,
      actorId: actor.id || 'officer',
      actorName: actor.name || 'Officer',
      reason: review.reason,
      timestamp: now,
    });

    return await this._saveReview(review);
  },

  /**
   * Officer marks a finding as resolved. A MANDATORY resolution note is required.
   */
  async resolveFinding(findingId, reason, actor = {}) {
    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      throw new Error('A detailed explanation (at least 5 characters) is required to resolve a discrepancy finding.');
    }

    const review = await this.getOrCreateReview(findingId);
    const prevStatus = review.status;
    const now = new Date().toISOString();

    review.status = REVIEW_STATUS.RESOLVED;
    review.reason = reason.trim();

    review.history.push({
      action: 'RESOLVED',
      fromStatus: prevStatus,
      toStatus: REVIEW_STATUS.RESOLVED,
      actorId: actor.id || 'officer',
      actorName: actor.name || 'Officer',
      reason: review.reason,
      timestamp: now,
    });

    return await this._saveReview(review);
  },

  /**
   * Reopens a previously dismissed or resolved finding
   */
  async reopenFinding(findingId, reason = '', actor = {}) {
    const review = await this.getOrCreateReview(findingId);
    const prevStatus = review.status;
    const now = new Date().toISOString();

    review.status = REVIEW_STATUS.OPEN;
    review.reason = reason ? reason.trim() : 'Finding reopened for re-investigation.';

    review.history.push({
      action: 'REOPENED',
      fromStatus: prevStatus,
      toStatus: REVIEW_STATUS.OPEN,
      actorId: actor.id || 'officer',
      actorName: actor.name || 'Officer',
      reason: review.reason,
      timestamp: now,
    });

    return await this._saveReview(review);
  },

  /**
   * Adds an investigative note to a finding's audit timeline
   */
  async addNote(findingId, noteText, actor = {}) {
    if (!noteText || typeof noteText !== 'string' || !noteText.trim()) {
      throw new Error('Note text cannot be empty.');
    }

    const review = await this.getOrCreateReview(findingId);
    const now = new Date().toISOString();
    const note = {
      noteId: `note-${Date.now().toString(36)}`,
      actorId: actor.id || 'officer',
      actorName: actor.name || 'Regulatory Officer',
      actorRole: actor.role || 'officer',
      text: noteText.trim(),
      createdAt: now,
    };

    review.notes.push(note);
    review.history.push({
      action: 'ADDED_NOTE',
      fromStatus: review.status,
      toStatus: review.status,
      actorId: actor.id || 'officer',
      actorName: actor.name || 'Regulatory Officer',
      reason: `Added note: "${noteText.trim().slice(0, 50)}${noteText.length > 50 ? '...' : ''}"`,
      timestamp: now,
    });

    return await this._saveReview(review);
  },

  /**
   * Clears all reviews (for testing)
   */
  async clearAllReviews() {
    storageService.removeItem(STORAGE_KEYS.INTELLIGENCE_REVIEWS);
  },
};
