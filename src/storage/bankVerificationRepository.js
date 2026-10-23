/**
 * NidhiSetu Storage — Bank Verification Repository
 * Core persistence, deterministic state machine, and querying layer for Bank Confirmation & Lien Verification Requests.
 *
 * NOTE: PURELY A SIMULATION RECORD REPOSITORY.
 * Does not communicate with live banking endpoints or SFMS/CBS gateways.
 */

import { storageService, STORAGE_KEYS } from './storageService';
import { auditRepository } from './auditRepository';
import { notificationRepository } from './notificationRepository';
import { bankSimulator } from '../banking/bankSimulator';
import { bankMessageRepository } from './bankMessageRepository';
import { verificationSummaryBuilder } from '../banking/verificationSummaryBuilder';
import { SIMULATION_DISCLAIMER, generateUUID } from '../banking/bankMessageSchema';

export const REQUEST_STATUS = {
  DRAFT: 'DRAFT',
  REQUESTED: 'REQUESTED',
  PROCESSING: 'PROCESSING',
  RESPONSE_RECEIVED: 'RESPONSE_RECEIVED',
  RESPONSE_FAILED: 'RESPONSE_FAILED',
  CANCELLED: 'CANCELLED',
};

export const REVIEW_STATUS = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  UNDER_REVIEW: 'UNDER_REVIEW',
  REVIEW_COMPLETED: 'REVIEW_COMPLETED',
  REQUIRES_FOLLOW_UP: 'REQUIRES_FOLLOW_UP',
};

export const VALID_REQUEST_TRANSITIONS = {
  [REQUEST_STATUS.DRAFT]: [REQUEST_STATUS.REQUESTED, REQUEST_STATUS.CANCELLED],
  [REQUEST_STATUS.REQUESTED]: [REQUEST_STATUS.PROCESSING, REQUEST_STATUS.CANCELLED],
  [REQUEST_STATUS.PROCESSING]: [REQUEST_STATUS.RESPONSE_RECEIVED, REQUEST_STATUS.RESPONSE_FAILED],
  [REQUEST_STATUS.RESPONSE_RECEIVED]: [REQUEST_STATUS.REQUESTED], // Can retry
  [REQUEST_STATUS.RESPONSE_FAILED]: [REQUEST_STATUS.REQUESTED, REQUEST_STATUS.CANCELLED], // Can retry
  [REQUEST_STATUS.CANCELLED]: [],
};

export const VALID_REVIEW_TRANSITIONS = {
  [REVIEW_STATUS.PENDING_REVIEW]: [
    REVIEW_STATUS.UNDER_REVIEW,
    REVIEW_STATUS.REQUIRES_FOLLOW_UP,
    REVIEW_STATUS.REVIEW_COMPLETED,
  ],
  [REVIEW_STATUS.UNDER_REVIEW]: [
    REVIEW_STATUS.REVIEW_COMPLETED,
    REVIEW_STATUS.REQUIRES_FOLLOW_UP,
  ],
  [REVIEW_STATUS.REQUIRES_FOLLOW_UP]: [
    REVIEW_STATUS.UNDER_REVIEW,
    REVIEW_STATUS.REVIEW_COMPLETED,
  ],
  [REVIEW_STATUS.REVIEW_COMPLETED]: [REVIEW_STATUS.UNDER_REVIEW], // Reopen review
};

export const bankVerificationRepository = {
  /**
   * Retrieves all bank verification requests from localStorage
   */
  async getAllRequests() {
    const list = storageService.getItem(STORAGE_KEYS.BANK_VERIFICATIONS, []);
    return Array.isArray(list) ? list : [];
  },

  /**
   * Retrieves a single verification request by its ID
   */
  async getRequestById(requestId) {
    if (!requestId) return null;
    const all = await this.getAllRequests();
    return all.find((r) => r.requestId === requestId || r.id === requestId) || null;
  },

  /**
   * Retrieves a single verification request by its human-readable reference
   */
  async getRequestByReference(ref) {
    if (!ref) return null;
    const all = await this.getAllRequests();
    return all.find((r) => r.requestReference?.toUpperCase() === ref.trim().toUpperCase()) || null;
  },

  /**
   * Retrieves verification requests for a specific FDR
   */
  async getRequestsByFdrId(fdrId) {
    if (!fdrId) return [];
    const all = await this.getAllRequests();
    return all
      .filter((r) => r.fdrId === fdrId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  /**
   * Retrieves latest verification request for an FDR
   */
  async getLatestRequestForFdr(fdrId) {
    const list = await this.getRequestsByFdrId(fdrId);
    return list.length > 0 ? list[0] : null;
  },

  /**
   * Generates next sequential reference number: BVR-2026-0001
   */
  async generateReferenceNumber() {
    const all = await this.getAllRequests();
    const year = new Date().getFullYear();
    const count = all.length + 1;
    return `BVR-${year}-${String(count).padStart(4, '0')}`;
  },

  /**
   * Creates a new bank verification request
   */
  async createVerificationRequest({
    fdrId,
    fdrReference,
    institutionId,
    institutionName,
    simulatorBankId,
    bankName,
    fdrNumber,
    declaredAmountPaise,
    depositDate,
    maturityDate,
    accountHolderName,
    requestedVerificationTypes = ['FDR_EXISTENCE_CHECK', 'DEPOSIT_DETAILS_CHECK', 'LIEN_STATUS_CHECK'],
    officerReason = 'Mandatory FDR & Lien regulatory verification',
    officerId = 'usr-demo-officer-01',
    scenarioId = 'SCENARIO_A_EXACT_MATCH',
    isDraft = false,
  }) {
    if (!fdrId) throw new Error('Mandatory field missing: fdrId');
    if (!fdrNumber) throw new Error('Mandatory field missing: fdrNumber');
    if (!simulatorBankId) throw new Error('Mandatory field missing: simulatorBankId');

    // Duplicate verification check
    const existingActive = (await this.getRequestsByFdrId(fdrId)).find(
      (r) =>
        r.requestStatus === REQUEST_STATUS.REQUESTED ||
        r.requestStatus === REQUEST_STATUS.PROCESSING
    );

    if (existingActive) {
      throw new Error(
        `A bank confirmation request (${existingActive.requestReference}) is currently active for this FDR. Complete or cancel it before initiating a new request.`
      );
    }

    const requestId = `bvr-${generateUUID().substring(0, 8)}`;
    const requestReference = await this.generateReferenceNumber();
    const correlationId = generateUUID();
    const createdAt = new Date().toISOString();

    const initialRequestStatus = isDraft ? REQUEST_STATUS.DRAFT : REQUEST_STATUS.REQUESTED;

    const newRecord = {
      id: requestId,
      requestId,
      requestReference,
      correlationId,
      fdrId,
      fdrReference,
      institutionId,
      institutionName,
      simulatorBankId,
      bankName,
      fdrNumber,
      declaredAmountPaise: Number(declaredAmountPaise) || 0,
      depositDate,
      maturityDate,
      accountHolderName,
      requestedVerificationTypes,
      officerReason,
      officerId,
      scenarioId,
      requestStatus: initialRequestStatus,
      reviewStatus: REVIEW_STATUS.PENDING_REVIEW,
      simulationResponse: null,
      summaryScorecard: null,
      disclaimer: SIMULATION_DISCLAIMER,
      simulationMode: true,
      sourceType: 'SYNTHETIC_BANK_SIMULATOR',
      statusHistory: [
        {
          status: initialRequestStatus,
          timestamp: createdAt,
          actorId: officerId,
          notes: isDraft ? 'Draft verification inquiry created' : 'Simulated verification request queued',
        },
      ],
      createdAt,
      updatedAt: createdAt,
      retryCount: 0,
    };

    const all = await this.getAllRequests();
    all.push(newRecord);
    storageService.setItem(STORAGE_KEYS.BANK_VERIFICATIONS, all);

    // Audit log
    await auditRepository.logEvent({
      eventType: 'BANK_VERIFICATION_REQUEST_CREATED',
      actorId: officerId,
      actorRole: 'OFFICER',
      targetEntityId: requestId,
      summary: `Created simulated bank confirmation inquiry ${requestReference} for FDR ${fdrNumber}`,
      metadata: {
        fdrId,
        requestReference,
        simulatorBankId,
        scenarioId,
      },
    });

    // Notify Officer
    await notificationRepository.createNotification({
      role: 'officer',
      title: 'Bank Verification Request Created',
      message: `Inquiry ${requestReference} initiated for FDR ${fdrNumber} (${bankName}).`,
      category: 'banking',
    });

    return newRecord;
  },

  /**
   * Executes the simulation for an existing request
   */
  async processVerificationRequest(requestId, options = {}) {
    const record = await this.getRequestById(requestId);
    if (!record) throw new Error(`Request not found: ${requestId}`);

    // Update state to PROCESSING
    await this.updateRequestStatus(requestId, REQUEST_STATUS.PROCESSING, {
      notes: 'Simulating mock financial messaging exchange with synthetic bank gateway.',
    });

    try {
      const scenarioToRun = options.scenarioId || record.scenarioId || 'SCENARIO_A_EXACT_MATCH';

      // Execute simulation engine
      const simResult = await bankSimulator.executeSimulation(
        record,
        scenarioToRun,
        options
      );

      // Save messages to message repository
      if (simResult.requestMessage) {
        await bankMessageRepository.saveMessage(simResult.requestMessage);
      }
      if (simResult.responseMessage) {
        await bankMessageRepository.saveMessage(simResult.responseMessage);
      }

      // Build summary scorecard
      const fdrData = {
        id: record.fdrId,
        fdrNumber: record.fdrNumber,
        depositAmountPaise: record.declaredAmountPaise,
        depositDate: record.depositDate,
        maturityDate: record.maturityDate,
        accountHolderName: record.accountHolderName,
        institutionId: record.institutionId,
      };

      const summary = verificationSummaryBuilder.buildSummary(
        record,
        fdrData,
        simResult.response
      );

      // Update state to RESPONSE_RECEIVED or RESPONSE_FAILED
      const nextStatus =
        simResult.response.responseStatus === 'SUCCESS'
          ? REQUEST_STATUS.RESPONSE_RECEIVED
          : REQUEST_STATUS.RESPONSE_FAILED;

      const updated = await this.updateRequestStatus(requestId, nextStatus, {
        notes: `Simulated response recorded: ${simResult.response.responseStatus}.`,
        simulationResponse: simResult.response,
        summaryScorecard: summary,
        scenarioId: scenarioToRun,
      });

      // Audit log
      await auditRepository.logEvent({
        eventType: 'BANK_SIMULATION_RESPONSE_RECEIVED',
        actorId: 'SYNTHETIC_BANK_SIMULATOR',
        actorRole: 'SYSTEM',
        targetEntityId: requestId,
        summary: `Simulated confirmation response processed for ${record.requestReference} (${scenarioToRun})`,
        metadata: {
          requestId,
          responseStatus: simResult.response.responseStatus,
          verdict: summary.verificationVerdict,
        },
      });

      // Notification to Officer
      await notificationRepository.createNotification({
        role: 'officer',
        title: 'Bank Confirmation Simulation Response Received',
        message: `Response received for ${record.requestReference} (${summary.verificationVerdict}). Ready for review.`,
        category: 'banking',
      });

      // Notification to Institution (General simulation update)
      if (record.institutionId) {
        await notificationRepository.createNotification({
          userId: record.institutionId,
          role: 'institution',
          title: 'Bank Confirmation Status Updated',
          message: `Regulatory authority has received simulated bank confirmation details for FDR ${record.fdrNumber}.`,
          category: 'banking',
        });
      }

      return updated;
    } catch (err) {
      console.error('[BankVerificationRepo] Processing failed:', err);
      return await this.updateRequestStatus(requestId, REQUEST_STATUS.RESPONSE_FAILED, {
        notes: `Simulation execution failed: ${err.message}`,
      });
    }
  },

  /**
   * Updates request state with strict state machine transition validation
   */
  async updateRequestStatus(requestId, targetStatus, patch = {}) {
    if (!requestId) throw new Error('requestId is mandatory');
    if (!targetStatus || !REQUEST_STATUS[targetStatus]) {
      throw new Error(`Invalid target request status: ${targetStatus}`);
    }

    const all = await this.getAllRequests();
    const index = all.findIndex((r) => r.requestId === requestId || r.id === requestId);
    if (index === -1) throw new Error(`Request not found: ${requestId}`);

    const current = all[index];
    const allowed = VALID_REQUEST_TRANSITIONS[current.requestStatus] || [];

    if (!allowed.includes(targetStatus)) {
      throw new Error(
        `Invalid request status transition: Cannot transition from ${current.requestStatus} to ${targetStatus}. Allowed: ${allowed.join(', ') || 'None'}`
      );
    }

    const timestamp = new Date().toISOString();
    const updatedHistory = [
      ...(current.statusHistory || []),
      {
        status: targetStatus,
        timestamp,
        notes: patch.notes || `Transitioned to ${targetStatus}`,
      },
    ];

    const updated = {
      ...current,
      ...patch,
      requestStatus: targetStatus,
      statusHistory: updatedHistory,
      updatedAt: timestamp,
    };

    all[index] = updated;
    storageService.setItem(STORAGE_KEYS.BANK_VERIFICATIONS, all);
    return updated;
  },

  /**
   * Updates officer review state with strict state machine transition validation
   */
  async updateReviewStatus(requestId, targetReviewStatus, actorId, notes = '') {
    if (!targetReviewStatus || !REVIEW_STATUS[targetReviewStatus]) {
      throw new Error(`Invalid target review status: ${targetReviewStatus}`);
    }

    const all = await this.getAllRequests();
    const index = all.findIndex((r) => r.requestId === requestId || r.id === requestId);
    if (index === -1) throw new Error(`Request not found: ${requestId}`);

    const current = all[index];
    const allowed = VALID_REVIEW_TRANSITIONS[current.reviewStatus] || [];

    if (!allowed.includes(targetReviewStatus)) {
      throw new Error(
        `Invalid review status transition: Cannot transition from ${current.reviewStatus} to ${targetReviewStatus}. Allowed: ${allowed.join(', ') || 'None'}`
      );
    }

    const timestamp = new Date().toISOString();
    const updated = {
      ...current,
      reviewStatus: targetReviewStatus,
      reviewCompletedAt: targetReviewStatus === REVIEW_STATUS.REVIEW_COMPLETED ? timestamp : current.reviewCompletedAt,
      updatedAt: timestamp,
    };

    all[index] = updated;
    storageService.setItem(STORAGE_KEYS.BANK_VERIFICATIONS, all);

    // Audit log
    await auditRepository.logEvent({
      eventType: `BANK_VERIFICATION_REVIEW_STATUS_${targetReviewStatus}`,
      actorId: actorId || 'usr-demo-officer-01',
      actorRole: 'OFFICER',
      targetEntityId: requestId,
      summary: `Verification review status changed to ${targetReviewStatus} for ${current.requestReference}`,
      metadata: { requestId, notes },
    });

    return updated;
  },

  /**
   * Retries a failed or completed verification request by creating a new linked attempt
   */
  async retryVerificationRequest(requestId, officerId = 'usr-demo-officer-01', newScenarioId = null) {
    const original = await this.getRequestById(requestId);
    if (!original) throw new Error(`Original request not found: ${requestId}`);

    const newRequest = await this.createVerificationRequest({
      fdrId: original.fdrId,
      fdrReference: original.fdrReference,
      institutionId: original.institutionId,
      institutionName: original.institutionName,
      simulatorBankId: original.simulatorBankId,
      bankName: original.bankName,
      fdrNumber: original.fdrNumber,
      declaredAmountPaise: original.declaredAmountPaise,
      depositDate: original.depositDate,
      maturityDate: original.maturityDate,
      accountHolderName: original.accountHolderName,
      requestedVerificationTypes: original.requestedVerificationTypes,
      officerReason: `Retry attempt for ${original.requestReference}`,
      officerId,
      scenarioId: newScenarioId || original.scenarioId,
    });

    // Link retry metadata
    newRequest.originalRequestId = original.requestId;
    newRequest.retryCount = (original.retryCount || 0) + 1;

    const all = await this.getAllRequests();
    const idx = all.findIndex((r) => r.requestId === newRequest.requestId);
    if (idx !== -1) {
      all[idx] = newRequest;
      storageService.setItem(STORAGE_KEYS.BANK_VERIFICATIONS, all);
    }

    return newRequest;
  },

  /**
   * Calculates dashboard summary statistics for the Officer Bank Verifications view
   */
  async getOfficerDashboardStats() {
    const all = await this.getAllRequests();
    const nonDrafts = all.filter((r) => r.requestStatus !== REQUEST_STATUS.DRAFT);

    return {
      totalRequests: nonDrafts.length,
      pendingRequests: nonDrafts.filter(
        (r) =>
          r.requestStatus === REQUEST_STATUS.REQUESTED ||
          r.requestStatus === REQUEST_STATUS.PROCESSING
      ).length,
      responsesReceived: nonDrafts.filter(
        (r) => r.requestStatus === REQUEST_STATUS.RESPONSE_RECEIVED
      ).length,
      requiresFollowUp: nonDrafts.filter(
        (r) => r.reviewStatus === REVIEW_STATUS.REQUIRES_FOLLOW_UP
      ).length,
      completedReviews: nonDrafts.filter(
        (r) => r.reviewStatus === REVIEW_STATUS.REVIEW_COMPLETED
      ).length,
    };
  },

  /**
   * Calculates platform-wide telemetry for the Admin Bank Monitoring view
   */
  async getAdminMonitoringStats() {
    const all = await this.getAllRequests();
    const responseStatuses = {
      SUCCESS: 0,
      FAILED: 0,
      TIMEOUT: 0,
      MALFORMED: 0,
    };

    let timeoutCount = 0;
    let lienConfirmedCount = 0;
    let lienDiscrepancyCount = 0;

    for (const r of all) {
      if (r.simulationResponse) {
        const s = r.simulationResponse.responseStatus;
        if (responseStatuses[s] !== undefined) {
          responseStatuses[s]++;
        }
        if (s === 'TIMEOUT') timeoutCount++;

        const ls = r.simulationResponse.lienStatus;
        if (ls === 'LIEN_RECORDED_IN_SIMULATION') {
          lienConfirmedCount++;
        } else if (
          ls === 'LIEN_NOT_RECORDED_IN_SIMULATION' ||
          ls === 'BENEFICIARY_MISMATCH_IN_SIMULATION'
        ) {
          lienDiscrepancyCount++;
        }
      }
    }

    return {
      totalRequests: all.length,
      responseStatuses,
      timeoutCount,
      lienConfirmedCount,
      lienDiscrepancyCount,
      activeSimulatorsCount: 6,
    };
  },

  /**
   * Resets all verification records (for demo reset)
   */
  async clearAll() {
    storageService.setItem(STORAGE_KEYS.BANK_VERIFICATIONS, []);
    return true;
  },
};
