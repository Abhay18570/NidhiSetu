/**
 * NidhiSetu Storage — Administrative Release Request Repository
 * Manages institutional requests for administrative clearance of superseded or released FDRs.
 *
 * CRITICAL REGULATORY & EDUCATIONAL DISCLAIMER:
 * Administrative clearance indicates that the regulatory authority no longer requires
 * administrative retention of the deposit. IT NEVER RELEASES AN ACTUAL COMMERCIAL BANK LIEN.
 */

import { storageService, STORAGE_KEYS } from './storageService';
import { auditRepository } from './auditRepository';
import { notificationRepository } from './notificationRepository';
import {
  RELEASE_STATUS,
  ADMIN_RELEASE_DISCLAIMER,
} from '../renewal/renewalModel';
import { validateReleaseTransition } from '../renewal/renewalWorkflowEngine';

export const releaseRequestRepository = {
  /**
   * Retrieves all release requests
   */
  async getAllRequests() {
    const list = storageService.getItem(STORAGE_KEYS.RELEASE_REQUESTS, []);
    return Array.isArray(list) ? list : [];
  },

  /**
   * Retrieves release request by ID
   */
  async getRequestById(requestId) {
    if (!requestId) return null;
    const all = await this.getAllRequests();
    return all.find((r) => r.requestId === requestId || r.id === requestId) || null;
  },

  /**
   * Retrieves release requests for an institution
   */
  async getRequestsByInstitutionId(institutionId) {
    if (!institutionId) return [];
    const all = await this.getAllRequests();
    return all
      .filter((r) => String(r.institutionId) === String(institutionId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  /**
   * Generates sequential reference number: REL-YYYY-000001
   */
  async generateReferenceNumber() {
    const all = await this.getAllRequests();
    const year = new Date().getFullYear();
    const count = all.length + 1;
    return `REL-${year}-${String(count).padStart(6, '0')}`;
  },

  /**
   * Creates a new administrative release request
   */
  async createRequest(payload, isDraft = false) {
    if (!payload.institutionId) throw new Error('institutionId is required.');
    if (!payload.originalFdrId) throw new Error('originalFdrId is required.');
    if (!payload.releaseReason && !isDraft) throw new Error('releaseReason is required.');

    const now = new Date().toISOString();
    const requestId = `REL-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const reference = payload.requestReference || (await this.generateReferenceNumber());

    const newRequest = {
      requestId,
      requestReference: reference,
      institutionId: String(payload.institutionId),
      institutionName: payload.institutionName || `Institution #${payload.institutionId}`,
      originalFdrId: String(payload.originalFdrId),
      originalFdrNumber: payload.originalFdrNumber || '',
      amountPaise: payload.amountPaise || 0,
      releaseReason: payload.releaseReason || '',
      relatedRenewalRequestId: payload.relatedRenewalRequestId || null,
      replacementFdrIds: (payload.replacementFdrIds || []).map(String),
      supportingExplanation: payload.supportingExplanation || '',
      supportingDocumentIds: payload.supportingDocumentIds || [],
      disclaimer: ADMIN_RELEASE_DISCLAIMER,
      status: isDraft ? RELEASE_STATUS.DRAFT : RELEASE_STATUS.SUBMITTED,
      assignedOfficerId: null,
      clearanceReason: null,
      declinedReason: null,
      officerNotes: [],
      timeline: [
        {
          action: isDraft ? 'DRAFT_SAVED' : 'REQUEST_SUBMITTED',
          timestamp: now,
          actor: payload.requestedBy || 'institution-user',
          details: isDraft ? 'Release request draft saved' : `Submitted release request ${reference}`,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const all = await this.getAllRequests();
    all.unshift(newRequest);
    storageService.setItem(STORAGE_KEYS.RELEASE_REQUESTS, all);

    if (!isDraft) {
      await auditRepository.logEvent({
        eventType: 'RELEASE_REQUEST_SUBMITTED',
        actorId: payload.requestedBy || 'institution-user',
        actorRole: 'institution',
        targetEntityId: requestId,
        summary: `Submitted administrative release request ${reference} for FDR ${payload.originalFdrNumber}`,
        metadata: { originalFdrId: payload.originalFdrId, reason: payload.releaseReason },
      });

      await notificationRepository.createNotification({
        role: 'officer',
        title: 'New Administrative Release Request',
        message: `${newRequest.institutionName} requested administrative release for certificate ${payload.originalFdrNumber}.`,
        link: `/officer/release-requests/${requestId}`,
        priority: 'normal',
      });
    }

    return newRequest;
  },

  /**
   * Deterministically transitions status of a release request
   */
  async transitionStatus(requestId, targetStatus, { actorId, actorRole, reason = '' } = {}) {
    const all = await this.getAllRequests();
    const index = all.findIndex((r) => r.requestId === requestId);
    if (index === -1) throw new Error(`Release request ${requestId} not found.`);

    const current = all[index];
    const validation = validateReleaseTransition(current.status, targetStatus, actorRole, reason);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const now = new Date().toISOString();
    const updated = {
      ...current,
      status: targetStatus,
      updatedAt: now,
      timeline: [
        ...(current.timeline || []),
        {
          action: `TRANSITION_TO_${targetStatus}`,
          timestamp: now,
          actor: actorId || 'user',
          actorRole: actorRole || 'officer',
          details: reason ? `Status changed to ${targetStatus}: ${reason}` : `Status changed to ${targetStatus}`,
        },
      ],
    };

    if (targetStatus === RELEASE_STATUS.ADMINISTRATIVELY_CLEARED) {
      updated.clearanceReason = reason;
      updated.clearedAt = now;
      updated.assignedOfficerId = actorId || current.assignedOfficerId;
    } else if (targetStatus === RELEASE_STATUS.DECLINED) {
      updated.declinedReason = reason;
    }

    if (reason) {
      updated.officerNotes = [...(current.officerNotes || []), `[${targetStatus}] ${reason}`];
    }

    all[index] = updated;
    storageService.setItem(STORAGE_KEYS.RELEASE_REQUESTS, all);

    await auditRepository.logEvent({
      eventType: `RELEASE_REQUEST_${targetStatus}`,
      actorId: actorId || 'user',
      actorRole: actorRole || 'officer',
      targetEntityId: requestId,
      summary: `Release request ${current.requestReference} transitioned to ${targetStatus}`,
      metadata: { reason, previousStatus: current.status, newStatus: targetStatus },
    });

    return updated;
  },
};
