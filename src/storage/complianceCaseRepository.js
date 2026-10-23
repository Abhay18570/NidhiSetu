/**
 * NidhiSetu Storage — Compliance Case Repository
 * Manages officer compliance cases, clarification requests, institution responses,
 * and adjudication lifecycle with mandatory substantive rationale.
 *
 * Case Statuses:
 * OPEN -> UNDER_REVIEW -> FOLLOW_UP_REQUESTED -> AWAITING_INSTITUTION_RESPONSE -> RESOLVED / CLOSED / REOPENED
 */

import { storageService, STORAGE_KEYS } from './storageService';
import { auditRepository } from './auditRepository';
import { notificationRepository } from './notificationRepository';

export const COMPLIANCE_CASE_STATUS = {
  OPEN: 'OPEN',
  UNDER_REVIEW: 'UNDER_REVIEW',
  FOLLOW_UP_REQUESTED: 'FOLLOW_UP_REQUESTED',
  AWAITING_INSTITUTION_RESPONSE: 'AWAITING_INSTITUTION_RESPONSE',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  REOPENED: 'REOPENED',
};

export const complianceCaseRepository = {
  /**
   * Retrieves all compliance cases
   */
  async getAllCases() {
    const list = storageService.getItem(STORAGE_KEYS.COMPLIANCE_CASES, []);
    return Array.isArray(list) ? list : [];
  },

  /**
   * Retrieves case by ID
   */
  async getCaseById(caseId) {
    if (!caseId) return null;
    const all = await this.getAllCases();
    return all.find((c) => c.caseId === caseId) || null;
  },

  /**
   * Retrieves all cases for an institution
   */
  async getCasesByInstitutionId(institutionId) {
    if (!institutionId) return [];
    const all = await this.getAllCases();
    return all
      .filter((c) => String(c.institutionId) === String(institutionId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  /**
   * Creates a new compliance case
   */
  async createCase({
    institutionId,
    institutionName,
    assessmentId,
    priority = 'MEDIUM',
    title,
    description,
    createdBy = 'officer-user',
  }) {
    if (!institutionId) throw new Error('institutionId is required to create a compliance case.');
    if (!title || title.trim().length === 0) throw new Error('Case title is required.');

    const now = new Date().toISOString();
    const caseId = `CASE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newCase = {
      caseId,
      caseNumber: `CMP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      institutionId: String(institutionId),
      institutionName: institutionName || `Institution #${institutionId}`,
      assessmentId: assessmentId || null,
      priority,
      title: title.trim(),
      description: description || '',
      status: COMPLIANCE_CASE_STATUS.OPEN,
      officerNotes: [],
      clarificationRequests: [],
      institutionResponses: [],
      timeline: [
        {
          action: 'CASE_CREATED',
          timestamp: now,
          actor: createdBy,
          details: `Case opened with priority ${priority}: ${title}`,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const all = await this.getAllCases();
    all.unshift(newCase);
    storageService.setItem(STORAGE_KEYS.COMPLIANCE_CASES, all);

    await auditRepository.logEvent({
      eventType: 'COMPLIANCE_CASE_CREATED',
      actorId: createdBy,
      actorRole: 'officer',
      targetEntityId: caseId,
      summary: `Opened compliance case ${newCase.caseNumber} for institution ${institutionId}`,
      metadata: { priority, assessmentId },
    });

    await notificationRepository.createNotification({
      role: 'institution',
      userId: institutionId,
      title: 'Compliance Review Case Opened',
      message: `A compliance case (${newCase.caseNumber}: "${title}") has been initiated for your institution.`,
      category: 'compliance',
    });

    return newCase;
  },

  /**
   * Officer transitions case to UNDER_REVIEW
   */
  async startReview(caseId, officerId = 'officer-user') {
    const all = await this.getAllCases();
    const target = all.find((c) => c.caseId === caseId);
    if (!target) throw new Error(`Case not found: ${caseId}`);

    const now = new Date().toISOString();
    target.status = COMPLIANCE_CASE_STATUS.UNDER_REVIEW;
    target.assignedOfficerId = officerId;
    target.updatedAt = now;
    target.timeline.push({
      action: 'REVIEW_STARTED',
      timestamp: now,
      actor: officerId,
      details: 'Officer commenced detailed compliance scrutiny.',
    });

    storageService.setItem(STORAGE_KEYS.COMPLIANCE_CASES, all);
    return target;
  },

  /**
   * Officer adds an internal note
   */
  async addOfficerNote(caseId, noteText, officerId = 'officer-user') {
    if (!noteText || noteText.trim().length === 0) {
      throw new Error('Note text is required.');
    }

    const all = await this.getAllCases();
    const target = all.find((c) => c.caseId === caseId);
    if (!target) throw new Error(`Case not found: ${caseId}`);

    const now = new Date().toISOString();
    const note = {
      noteId: `NOTE-${Date.now()}`,
      author: officerId,
      text: noteText.trim(),
      createdAt: now,
    };

    target.officerNotes.push(note);
    target.updatedAt = now;
    target.timeline.push({
      action: 'NOTE_ADDED',
      timestamp: now,
      actor: officerId,
      details: `Internal officer note recorded.`,
    });

    storageService.setItem(STORAGE_KEYS.COMPLIANCE_CASES, all);
    return target;
  },

  /**
   * Officer requests clarification from institution
   */
  async requestClarification(
    caseId,
    { clarificationQuestion, followUpDeadline = null, officerId = 'officer-user' }
  ) {
    if (!clarificationQuestion || clarificationQuestion.trim().length < 5) {
      throw new Error('Clarification question must be at least 5 characters.');
    }

    const all = await this.getAllCases();
    const target = all.find((c) => c.caseId === caseId);
    if (!target) throw new Error(`Case not found: ${caseId}`);

    const now = new Date().toISOString();
    const request = {
      requestId: `REQ-${Date.now()}`,
      question: clarificationQuestion.trim(),
      followUpDeadline,
      requestedBy: officerId,
      requestedAt: now,
      status: 'AWAITING_REPLY',
    };

    target.clarificationRequests.push(request);
    target.status = COMPLIANCE_CASE_STATUS.AWAITING_INSTITUTION_RESPONSE;
    target.updatedAt = now;
    target.timeline.push({
      action: 'CLARIFICATION_REQUESTED',
      timestamp: now,
      actor: officerId,
      details: `Clarification requested: "${clarificationQuestion.trim()}" (Deadline: ${followUpDeadline || 'None'})`,
    });

    storageService.setItem(STORAGE_KEYS.COMPLIANCE_CASES, all);

    await notificationRepository.createNotification({
      role: 'institution',
      userId: target.institutionId,
      title: 'Action Required: Compliance Clarification Requested',
      message: `Officer requested clarification on case ${target.caseNumber}: "${clarificationQuestion.slice(0, 100)}..."`,
      category: 'compliance',
    });

    return target;
  },

  /**
   * Institution submits clarification response
   */
  async submitInstitutionResponse(
    caseId,
    { responseText, institutionUserId = 'inst-user', attachmentReferences = [] }
  ) {
    if (!responseText || responseText.trim().length < 5) {
      throw new Error('Response text must be at least 5 characters.');
    }

    const all = await this.getAllCases();
    const target = all.find((c) => c.caseId === caseId);
    if (!target) throw new Error(`Case not found: ${caseId}`);

    const now = new Date().toISOString();
    const resp = {
      responseId: `RESP-${Date.now()}`,
      responseText: responseText.trim(),
      submittedBy: institutionUserId,
      submittedAt: now,
      attachmentReferences,
    };

    target.institutionResponses.push(resp);
    // Mark latest clarification as answered
    if (target.clarificationRequests.length > 0) {
      target.clarificationRequests[target.clarificationRequests.length - 1].status = 'ANSWERED';
    }

    target.status = COMPLIANCE_CASE_STATUS.UNDER_REVIEW;
    target.updatedAt = now;
    target.timeline.push({
      action: 'INSTITUTION_RESPONSE_SUBMITTED',
      timestamp: now,
      actor: institutionUserId,
      details: `Institution submitted response: "${responseText.trim()}"`,
    });

    storageService.setItem(STORAGE_KEYS.COMPLIANCE_CASES, all);

    await notificationRepository.createNotification({
      role: 'officer',
      title: 'Institution Clarification Received',
      message: `Institution ${target.institutionName || target.institutionId} submitted a response for case ${target.caseNumber}.`,
      category: 'compliance',
    });

    return target;
  },

  /**
   * Officer resolves case with mandatory substantive reason (>= 5 chars)
   */
  async resolveCase(caseId, { resolutionReason, officerId = 'officer-user' }) {
    if (!resolutionReason || resolutionReason.trim().length < 5) {
      throw new Error('A substantive resolution reason (at least 5 characters) is mandatory.');
    }

    const all = await this.getAllCases();
    const target = all.find((c) => c.caseId === caseId);
    if (!target) throw new Error(`Case not found: ${caseId}`);

    const now = new Date().toISOString();
    target.status = COMPLIANCE_CASE_STATUS.RESOLVED;
    target.resolutionReason = resolutionReason.trim();
    target.resolvedBy = officerId;
    target.resolvedAt = now;
    target.updatedAt = now;
    target.timeline.push({
      action: 'CASE_RESOLVED',
      timestamp: now,
      actor: officerId,
      details: `Case resolved: ${resolutionReason.trim()}`,
    });

    storageService.setItem(STORAGE_KEYS.COMPLIANCE_CASES, all);

    await auditRepository.logEvent({
      eventType: 'COMPLIANCE_CASE_RESOLVED',
      actorId: officerId,
      actorRole: 'officer',
      targetEntityId: caseId,
      summary: `Resolved compliance case ${target.caseNumber}: ${resolutionReason.trim()}`,
      metadata: { reason: resolutionReason.trim() },
    });

    await notificationRepository.createNotification({
      role: 'institution',
      userId: target.institutionId,
      title: 'Compliance Case Resolved',
      message: `Compliance case ${target.caseNumber} has been resolved by the reviewing officer.`,
      category: 'compliance',
    });

    return target;
  },

  /**
   * Officer closes case with mandatory substantive reason (>= 5 chars)
   */
  async closeCase(caseId, { closureReason, officerId = 'officer-user' }) {
    if (!closureReason || closureReason.trim().length < 5) {
      throw new Error('A substantive closure reason (at least 5 characters) is mandatory.');
    }

    const all = await this.getAllCases();
    const target = all.find((c) => c.caseId === caseId);
    if (!target) throw new Error(`Case not found: ${caseId}`);

    const now = new Date().toISOString();
    target.status = COMPLIANCE_CASE_STATUS.CLOSED;
    target.closureReason = closureReason.trim();
    target.closedBy = officerId;
    target.closedAt = now;
    target.updatedAt = now;
    target.timeline.push({
      action: 'CASE_CLOSED',
      timestamp: now,
      actor: officerId,
      details: `Case formally closed: ${closureReason.trim()}`,
    });

    storageService.setItem(STORAGE_KEYS.COMPLIANCE_CASES, all);
    return target;
  },

  /**
   * Officer reopens a resolved or closed case with mandatory reason
   */
  async reopenCase(caseId, { reopenReason, officerId = 'officer-user' }) {
    if (!reopenReason || reopenReason.trim().length < 5) {
      throw new Error('A substantive reopening reason (at least 5 characters) is mandatory.');
    }

    const all = await this.getAllCases();
    const target = all.find((c) => c.caseId === caseId);
    if (!target) throw new Error(`Case not found: ${caseId}`);

    const now = new Date().toISOString();
    target.status = COMPLIANCE_CASE_STATUS.REOPENED;
    target.reopenReason = reopenReason.trim();
    target.reopenedBy = officerId;
    target.reopenedAt = now;
    target.updatedAt = now;
    target.timeline.push({
      action: 'CASE_REOPENED',
      timestamp: now,
      actor: officerId,
      details: `Case reopened: ${reopenReason.trim()}`,
    });

    storageService.setItem(STORAGE_KEYS.COMPLIANCE_CASES, all);
    return target;
  },

  /**
   * Clears cases (for test / demo reset)
   */
  async clearAllCases() {
    storageService.removeItem(STORAGE_KEYS.COMPLIANCE_CASES);
  },
};
