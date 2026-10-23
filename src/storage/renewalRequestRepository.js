/**
 * NidhiSetu Storage — Renewal Request Repository
 * Manages persistence, state transitions, officer clarifications,
 * and institutional responses for FDR renewal and replacement applications.
 */

import { storageService, STORAGE_KEYS } from './storageService';
import { auditRepository } from './auditRepository';
import { notificationRepository } from './notificationRepository';
import {
  RENEWAL_STATUS,
  validateRenewalRequest,
} from '../renewal/renewalModel';
import { validateRenewalTransition } from '../renewal/renewalWorkflowEngine';

export const renewalRequestRepository = {
  /**
   * Retrieves all renewal requests
   */
  async getAllRequests() {
    const list = storageService.getItem(STORAGE_KEYS.RENEWAL_REQUESTS, []);
    return Array.isArray(list) ? list : [];
  },

  /**
   * Retrieves renewal request by its unique ID
   */
  async getRequestById(renewalRequestId) {
    if (!renewalRequestId) return null;
    const all = await this.getAllRequests();
    return all.find((r) => r.renewalRequestId === renewalRequestId || r.id === renewalRequestId) || null;
  },

  /**
   * Retrieves requests belonging to an institution
   */
  async getRequestsByInstitutionId(institutionId) {
    if (!institutionId) return [];
    const all = await this.getAllRequests();
    return all
      .filter((r) => String(r.institutionId) === String(institutionId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  /**
   * Retrieves active request for a specific source FDR
   */
  async getActiveRequestForOriginalFdr(originalFdrId) {
    if (!originalFdrId) return null;
    const all = await this.getAllRequests();
    return all.find(
      (r) =>
        String(r.originalFdrId) === String(originalFdrId) &&
        r.status !== RENEWAL_STATUS.WITHDRAWN &&
        r.status !== RENEWAL_STATUS.REJECTED
    ) || null;
  },

  /**
   * Generates sequential reference number: RNL-YYYY-000001
   */
  async generateReferenceNumber() {
    const all = await this.getAllRequests();
    const year = new Date().getFullYear();
    const count = all.length + 1;
    return `RNL-${year}-${String(count).padStart(6, '0')}`;
  },

  /**
   * Creates or submits a new renewal request
   */
  async createRequest(payload, isDraft = false) {
    const validation = validateRenewalRequest(payload);
    if (!validation.valid && !isDraft) {
      throw new Error(`Invalid renewal request: ${validation.errors.join(' ')}`);
    }

    const now = new Date().toISOString();
    const requestId = `RNL-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const reference = payload.renewalReference || (await this.generateReferenceNumber());

    const newRequest = {
      renewalRequestId: requestId,
      renewalReference: reference,
      institutionId: String(payload.institutionId),
      institutionName: payload.institutionName || `Institution #${payload.institutionId}`,
      originalFdrId: String(payload.originalFdrId),
      originalFdrNumber: payload.originalFdrNumber || '',
      replacementFdrIds: (payload.replacementFdrIds || []).map(String),
      replacementFdrNumbers: payload.replacementFdrNumbers || [],
      renewalType: payload.renewalType,
      requestedBy: payload.requestedBy || 'institution-user',
      submittedAt: isDraft ? null : now,
      oldMaturityDate: payload.oldMaturityDate || null,
      proposedMaturityDate: payload.proposedMaturityDate || null,
      originalAmountPaise: payload.originalAmountPaise || 0,
      replacementTotalPaise: payload.replacementTotalPaise || 0,
      continuityAssessmentId: payload.continuityAssessmentId || null,
      continuityStatus: payload.continuityStatus || 'INDETERMINATE',
      supportingDocumentIds: payload.supportingDocumentIds || [],
      status: isDraft ? RENEWAL_STATUS.DRAFT : RENEWAL_STATUS.SUBMITTED,
      assignedOfficerId: null,
      officerNotes: payload.officerNotes || [],
      clarificationRequests: [],
      institutionResponses: [],
      timeline: [
        {
          action: isDraft ? 'DRAFT_SAVED' : 'REQUEST_SUBMITTED',
          timestamp: now,
          actor: payload.requestedBy || 'institution-user',
          details: isDraft ? 'Renewal application draft saved' : `Submitted renewal request ${reference}`,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const all = await this.getAllRequests();
    all.unshift(newRequest);
    storageService.setItem(STORAGE_KEYS.RENEWAL_REQUESTS, all);

    if (!isDraft) {
      await auditRepository.logEvent({
        eventType: 'RENEWAL_REQUEST_SUBMITTED',
        actorId: payload.requestedBy || 'institution-user',
        actorRole: 'institution',
        targetEntityId: requestId,
        summary: `Submitted renewal request ${reference} for FDR ${payload.originalFdrNumber}`,
        metadata: {
          renewalType: payload.renewalType,
          originalFdrId: payload.originalFdrId,
          replacementFdrIds: payload.replacementFdrIds,
        },
      });

      await notificationRepository.createNotification({
        role: 'officer',
        title: 'New FDR Renewal Request Submitted',
        message: `${newRequest.institutionName} has submitted renewal application ${reference}.`,
        link: `/officer/renewals/${requestId}`,
        priority: 'high',
      });
    }

    return newRequest;
  },

  /**
   * Updates an existing request draft or fields
   */
  async updateDraft(renewalRequestId, updates) {
    const all = await this.getAllRequests();
    const index = all.findIndex((r) => r.renewalRequestId === renewalRequestId);
    if (index === -1) throw new Error('Renewal request not found.');

    const current = all[index];
    if (current.status !== RENEWAL_STATUS.DRAFT) {
      throw new Error('Only draft renewal applications can be edited.');
    }

    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    all[index] = updated;
    storageService.setItem(STORAGE_KEYS.RENEWAL_REQUESTS, all);
    return updated;
  },

  /**
   * Deterministically transitions the status of a renewal request
   */
  async transitionStatus(renewalRequestId, targetStatus, { actorId, actorRole, reason = '' } = {}) {
    const all = await this.getAllRequests();
    const index = all.findIndex((r) => r.renewalRequestId === renewalRequestId);
    if (index === -1) throw new Error(`Renewal request ${renewalRequestId} not found.`);

    const current = all[index];
    const validation = validateRenewalTransition(current.status, targetStatus, actorRole, reason);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const now = new Date().toISOString();
    const timelineEntry = {
      action: `TRANSITION_TO_${targetStatus}`,
      timestamp: now,
      actor: actorId || 'user',
      actorRole: actorRole || 'officer',
      details: reason ? `Status changed to ${targetStatus}: ${reason}` : `Status changed to ${targetStatus}`,
    };

    const updated = {
      ...current,
      status: targetStatus,
      updatedAt: now,
      timeline: [...(current.timeline || []), timelineEntry],
    };

    if (reason && (targetStatus === RENEWAL_STATUS.CLARIFICATION_REQUIRED || targetStatus === RENEWAL_STATUS.REJECTED)) {
      updated.officerNotes = [...(current.officerNotes || []), `[${targetStatus}] ${reason}`];
    }

    if (targetStatus === RENEWAL_STATUS.ACCEPTED_FOR_RECORD) {
      updated.reviewedAt = now;
      updated.assignedOfficerId = actorId || current.assignedOfficerId;
    }

    all[index] = updated;
    storageService.setItem(STORAGE_KEYS.RENEWAL_REQUESTS, all);

    await auditRepository.logEvent({
      eventType: `RENEWAL_TRANSITION_${targetStatus}`,
      actorId: actorId || 'user',
      actorRole: actorRole || 'officer',
      targetEntityId: renewalRequestId,
      summary: `Renewal ${current.renewalReference} transitioned from ${current.status} to ${targetStatus}`,
      metadata: { reason, previousStatus: current.status, newStatus: targetStatus },
    });

    return updated;
  },

  /**
   * Adds an officer clarification request
   */
  async requestClarification(renewalRequestId, { question, deadline, officerId = 'officer' }) {
    if (!question || question.trim().length < 5) {
      throw new Error('Substantive clarification query (min 5 characters) is required.');
    }

    const all = await this.getAllRequests();
    const index = all.findIndex((r) => r.renewalRequestId === renewalRequestId);
    if (index === -1) throw new Error('Renewal request not found.');

    const current = all[index];
    const now = new Date().toISOString();
    const clarificationId = `REQ-RNL-${Date.now().toString().slice(-4)}`;

    const newClarification = {
      requestId: clarificationId,
      question: question.trim(),
      requestedAt: now,
      deadline: deadline || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'AWAITING_REPLY',
      officerId,
    };

    const updated = {
      ...current,
      status: RENEWAL_STATUS.CLARIFICATION_REQUIRED,
      clarificationRequests: [...(current.clarificationRequests || []), newClarification],
      updatedAt: now,
      timeline: [
        ...(current.timeline || []),
        {
          action: 'CLARIFICATION_REQUESTED',
          timestamp: now,
          actor: officerId,
          details: question.trim(),
        },
      ],
    };

    all[index] = updated;
    storageService.setItem(STORAGE_KEYS.RENEWAL_REQUESTS, all);

    await notificationRepository.createNotification({
      role: 'institution',
      title: 'Clarification Required on FDR Renewal',
      message: `Scrutiny officer requested information on renewal ${current.renewalReference}: "${question.slice(0, 80)}..."`,
      link: `/institution/renewals`,
      priority: 'high',
    });

    return updated;
  },

  /**
   * Responds to an officer clarification request from institution
   */
  async submitClarificationResponse(renewalRequestId, { clarificationId, responseText, documentIds = [], responderId = 'inst-user' }) {
    if (!responseText || responseText.trim().length === 0) {
      throw new Error('Response text cannot be empty.');
    }

    const all = await this.getAllRequests();
    const index = all.findIndex((r) => r.renewalRequestId === renewalRequestId);
    if (index === -1) throw new Error('Renewal request not found.');

    const current = all[index];
    const now = new Date().toISOString();

    const clarifications = (current.clarificationRequests || []).map((c) => {
      if (c.requestId === clarificationId || !clarificationId) {
        return { ...c, status: 'REPLIED', repliedAt: now };
      }
      return c;
    });

    const responseEntry = {
      responseId: `RESP-${Date.now().toString().slice(-4)}`,
      clarificationId,
      responseText: responseText.trim(),
      documentIds,
      submittedAt: now,
      submittedBy: responderId,
    };

    const updated = {
      ...current,
      status: RENEWAL_STATUS.RESUBMITTED,
      clarificationRequests: clarifications,
      institutionResponses: [...(current.institutionResponses || []), responseEntry],
      updatedAt: now,
      timeline: [
        ...(current.timeline || []),
        {
          action: 'CLARIFICATION_SUBMITTED',
          timestamp: now,
          actor: responderId,
          details: responseText.trim(),
        },
      ],
    };

    all[index] = updated;
    storageService.setItem(STORAGE_KEYS.RENEWAL_REQUESTS, all);

    await notificationRepository.createNotification({
      role: 'officer',
      title: 'Clarification Received on Renewal Application',
      message: `${current.institutionName} responded to clarification for renewal ${current.renewalReference}.`,
      link: `/officer/renewals/${current.renewalRequestId}`,
      priority: 'normal',
    });

    return updated;
  },

  /**
   * Adds an internal officer note
   */
  async addOfficerNote(renewalRequestId, noteText, officerId = 'officer') {
    if (!noteText || noteText.trim().length === 0) return null;

    const all = await this.getAllRequests();
    const index = all.findIndex((r) => r.renewalRequestId === renewalRequestId);
    if (index === -1) throw new Error('Renewal request not found.');

    const current = all[index];
    const updated = {
      ...current,
      officerNotes: [...(current.officerNotes || []), `[${new Date().toISOString().split('T')[0]} - ${officerId}] ${noteText.trim()}`],
      updatedAt: new Date().toISOString(),
    };

    all[index] = updated;
    storageService.setItem(STORAGE_KEYS.RENEWAL_REQUESTS, all);
    return updated;
  },
};
