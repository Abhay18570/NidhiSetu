/**
 * NidhiSetu FDR Repository
 * Core data access, validation, persistence, and querying layer for Fixed Deposit Receipts.
 * All repository calls return Promises to provide an asynchronous contract ready for backend APIs.
 */

import { storageService, STORAGE_KEYS } from './storageService';
import { fdrLifecycleRepository, FDR_STATUS } from './fdrLifecycleRepository';
import { fdrDocumentRepository } from './fdrDocumentRepository';
import { auditRepository } from './auditRepository';
import { notificationRepository } from './notificationRepository';
import { rupeesToPaise, isValidIFSC, isMaturityDateValid } from './fdrValidation';
import { getDaysUntilMaturity } from './fdrMaturityService';

export const fdrRepository = {
  /**
   * Retrieves all FDR records from localStorage
   */
  async getAllFDRs() {
    const list = storageService.getItem(STORAGE_KEYS.FDR_RECORDS, []);
    return Array.isArray(list) ? list : [];
  },

  /** Aliases for convenience */
  async getAllFdrRecords() {
    return this.getAllFDRs();
  },

  async getFdrsByInstitutionId(institutionId, options = {}) {
    return this.getFDRsByInstitution(institutionId, options);
  },

  async createFdr(fdrData, actor = {}) {
    return this.createFDR(fdrData, actor);
  },

  /**
   * Retrieves a single FDR record by its ID
   */
  async getFDRById(id) {
    if (!id) return null;
    const all = await this.getAllFDRs();
    return all.find((f) => f.id === id) || null;
  },

  /**
   * Retrieves a single FDR record by its reference number
   */
  async getFDRByReferenceNumber(refNo) {
    if (!refNo) return null;
    const all = await this.getAllFDRs();
    return all.find((f) => f.referenceNumber?.toLowerCase() === refNo.trim().toLowerCase()) || null;
  },

  /**
   * Retrieves FDR records for a specific institution with optional search and filters
   */
  async getFDRsByInstitution(institutionId, options = {}) {
    if (!institutionId) return [];
    const all = await this.getAllFDRs();
    let results = all.filter((f) => f.institutionId === institutionId);

    // Filter by status
    if (options.status && options.status !== 'ALL') {
      results = results.filter((f) => f.status === options.status);
    }

    // Filter by bank
    if (options.bankName) {
      results = results.filter((f) => f.bankName?.toLowerCase().includes(options.bankName.toLowerCase()));
    }

    // Search query (referenceNumber, bankName, fdrNumber, remarks)
    if (options.query) {
      const q = options.query.toLowerCase();
      results = results.filter(
        (f) =>
          f.referenceNumber?.toLowerCase().includes(q) ||
          f.fdrNumber?.toLowerCase().includes(q) ||
          f.bankName?.toLowerCase().includes(q) ||
          f.branchName?.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (options.sortBy === 'maturity') {
      results.sort((a, b) => new Date(a.maturityDate) - new Date(b.maturityDate));
    } else if (options.sortBy === 'amount') {
      results.sort((a, b) => (b.depositAmountPaise || 0) - (a.depositAmountPaise || 0));
    } else {
      // Default: Most recent submission first
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return results;
  },

  /**
   * Checks if an FDR number is duplicate
   */
  async isFdrNumberDuplicate(ifsc, fdrNumber, excludeId = null) {
    if (!fdrNumber) return false;
    const all = await this.getAllFDRs();
    const cleanNum = fdrNumber.trim().toUpperCase();
    return all.some(
      (f) =>
        f.id !== excludeId &&
        f.fdrNumber?.trim().toUpperCase() === cleanNum
    );
  },

  /**
   * Creates and submits a new FDR record
   */
  async createFDR(fdrData, actor = {}) {
    // Basic validation
    if (!fdrData.institutionId) {
      throw new Error('Institution ID is required.');
    }
    if (!fdrData.bankName || !fdrData.fdrNumber) {
      throw new Error('Bank name and FDR number are required.');
    }
    if (fdrData.ifsc && !isValidIFSC(fdrData.ifsc)) {
      throw new Error(`Invalid IFSC code format: "${fdrData.ifsc}". Must match standard 11-character format.`);
    }
    if (!fdrData.depositDate || !fdrData.maturityDate) {
      throw new Error('Both deposit creation date and maturity date are required.');
    }
    if (!isMaturityDateValid(fdrData.depositDate, fdrData.maturityDate)) {
      throw new Error('Maturity date must be strictly after the deposit date.');
    }

    const all = await this.getAllFDRs();

    // Check duplicate FDR number for the same institution
    const duplicate = all.find(
      (f) =>
        f.institutionId === fdrData.institutionId &&
        f.fdrNumber.trim().toLowerCase() === fdrData.fdrNumber.trim().toLowerCase() &&
        f.status !== FDR_STATUS.REVIEW_REJECTED
    );
    if (duplicate) {
      throw new Error(`An FDR with number "${fdrData.fdrNumber}" is already registered for this institution.`);
    }

    const fdrId = fdrData.id || `fdr-${crypto.randomUUID().slice(0, 8)}`;
    const currentYear = new Date().getFullYear();
    const referenceNumber = `FDR-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;

    const depositAmountPaise = fdrData.depositAmountPaise !== undefined
      ? fdrData.depositAmountPaise
      : rupeesToPaise(fdrData.depositAmount);

    const nowIso = new Date().toISOString();

    const newRecord = {
      id: fdrId,
      referenceNumber,
      institutionId: fdrData.institutionId,
      submittedBy: actor.id || fdrData.submittedBy || 'institution',
      createdAt: nowIso,
      updatedAt: nowIso,
      submittedAt: nowIso,

      // Bank Details
      bankName: fdrData.bankName.trim(),
      branchName: fdrData.branchName ? fdrData.branchName.trim() : '',
      branchAddress: fdrData.branchAddress ? fdrData.branchAddress.trim() : '',
      ifsc: fdrData.ifsc ? fdrData.ifsc.trim().toUpperCase() : '',
      fdrNumber: fdrData.fdrNumber.trim(),
      accountHolderName: fdrData.accountHolderName ? fdrData.accountHolderName.trim() : '',

      // Deposit Details
      depositAmountPaise,
      currency: 'INR',
      depositDate: fdrData.depositDate,
      maturityDate: fdrData.maturityDate,
      interestRate: fdrData.interestRate ? Number(fdrData.interestRate) : 0,
      depositType: fdrData.depositType || 'Fixed Deposit (Cumulative)',
      applicableSecurityRequirement: fdrData.applicableSecurityRequirement || '',
      remarks: fdrData.remarks ? fdrData.remarks.trim() : '',

      // Document References
      documentId: fdrData.documentId || null,
      fileName: fdrData.fileName || null,
      fileType: fdrData.fileType || null,
      fileSize: fdrData.fileSize || 0,
      sha256Hash: fdrData.sha256Hash || null,
      uploadedAt: fdrData.uploadedAt || nowIso,

      // Lifecycle
      status: FDR_STATUS.SUBMITTED,
      assignedOfficerId: null,
      reviewNotes: null,
      clarificationReason: null,
      reviewedAt: null,
      lastStatusChangeAt: nowIso,
      renewalReferenceId: fdrData.renewalReferenceId || null,
    };

    // Save record
    const updatedList = [newRecord, ...all];
    storageService.setItem(STORAGE_KEYS.FDR_RECORDS, updatedList);

    // Record Lifecycle Event
    await fdrLifecycleRepository.recordTransition(fdrId, FDR_STATUS.SUBMITTED, {
      actorId: actor.id || 'institution',
      actorRole: 'institution',
      actorName: actor.name || 'Institution Representative',
      previousStatus: FDR_STATUS.DRAFT,
      notes: fdrData.renewalReferenceId
        ? `Renewal submission linked to prior FDR ${fdrData.renewalReferenceId}`
        : 'Initial formal submission of institutional security deposit receipt.',
    });

    // Record System Audit Log
    await auditRepository.logEvent({
      eventType: 'FDR_SUBMITTED',
      actorId: actor.id || 'institution',
      actorRole: 'institution',
      targetEntityId: fdrId,
      summary: `FDR #${newRecord.fdrNumber} (${referenceNumber}) submitted for verification by institution`,
      metadata: {
        fdrNumber: newRecord.fdrNumber,
        referenceNumber,
        bankName: newRecord.bankName,
        depositAmountPaise,
      },
    });

    // Generate in-app confirmation notification for institution
    await notificationRepository.createNotification({
      userId: actor.id || null,
      role: 'institution',
      title: 'FDR Submitted for Scrutiny',
      message: `Your deposit receipt #${newRecord.fdrNumber} (Ref: ${referenceNumber}) has been submitted for scrutiny officer review.`,
      category: 'fdr',
    });

    // Generate notification for scrutiny officers
    await notificationRepository.createNotification({
      role: 'officer',
      title: 'New FDR Docket in Scrutiny Queue',
      message: `A new FDR record (${referenceNumber}) from institution has arrived for regulatory review.`,
      category: 'scrutiny',
    });

    return newRecord;
  },

  /**
   * Updates an existing FDR record with role transition check
   */
  async updateFDR(id, updates, actor = {}) {
    const all = await this.getAllFDRs();
    const index = all.findIndex((f) => f.id === id);
    if (index === -1) {
      throw new Error(`FDR record with ID "${id}" not found.`);
    }

    const current = all[index];
    const nowIso = new Date().toISOString();

    // Check if status is transitioning
    if (updates.status && updates.status !== current.status) {
      const validation = fdrLifecycleRepository.validateTransition(
        current.status,
        updates.status,
        actor.role || 'officer'
      );
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Record transition event
      await fdrLifecycleRepository.recordTransition(id, updates.status, {
        actorId: actor.id,
        actorRole: actor.role,
        actorName: actor.name,
        previousStatus: current.status,
        reason: updates.clarificationReason || updates.reviewNotes || '',
        notes: updates.reviewNotes || '',
      });

      updates.lastStatusChangeAt = nowIso;
      if (['REVIEW_ACCEPTED', 'REVIEW_REJECTED'].includes(updates.status)) {
        updates.reviewedAt = nowIso;
        updates.assignedOfficerId = actor.id || current.assignedOfficerId;
      }
    }

    const updated = {
      ...current,
      ...updates,
      id: current.id, // Never alter ID
      referenceNumber: current.referenceNumber, // Never alter reference number
      institutionId: current.institutionId, // Never alter institution ownership
      updatedAt: nowIso,
    };

    all[index] = updated;
    storageService.setItem(STORAGE_KEYS.FDR_RECORDS, all);

    // Audit log
    await auditRepository.logEvent({
      eventType: 'FDR_UPDATED',
      actorId: actor.id || 'system',
      actorRole: actor.role || 'system',
      targetEntityId: id,
      summary: `FDR ${current.referenceNumber} updated to status "${updated.status}"`,
      metadata: { status: updated.status },
    });

    return updated;
  },

  /**
   * Saves a draft FDR for an institution
   */
  async saveDraft(draftData, institutionId) {
    if (!institutionId) throw new Error('institutionId is required to save draft.');

    const drafts = storageService.getItem(STORAGE_KEYS.FDR_DRAFTS, []);
    const safeDrafts = Array.isArray(drafts) ? drafts : [];

    const draftId = draftData.id || `draft-${crypto.randomUUID().slice(0, 8)}`;
    const nowIso = new Date().toISOString();

    const record = {
      ...draftData,
      id: draftId,
      institutionId,
      status: FDR_STATUS.DRAFT,
      updatedAt: nowIso,
      createdAt: draftData.createdAt || nowIso,
    };

    const index = safeDrafts.findIndex((d) => d.id === draftId && d.institutionId === institutionId);
    if (index >= 0) {
      safeDrafts[index] = record;
    } else {
      safeDrafts.unshift(record);
    }

    storageService.setItem(STORAGE_KEYS.FDR_DRAFTS, safeDrafts);
    return record;
  },

  /**
   * Retrieves drafts for an institution
   */
  async getDrafts(institutionId) {
    if (!institutionId) return [];
    const drafts = storageService.getItem(STORAGE_KEYS.FDR_DRAFTS, []);
    if (!Array.isArray(drafts)) return [];
    return drafts
      .filter((d) => d.institutionId === institutionId)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  /**
   * Deletes a draft FDR and its associated document scan from IndexedDB
   */
  async deleteDraft(draftId, institutionId) {
    if (!draftId || !institutionId) return false;

    const drafts = storageService.getItem(STORAGE_KEYS.FDR_DRAFTS, []);
    if (!Array.isArray(drafts)) return false;

    const targetDraft = drafts.find((d) => d.id === draftId && d.institutionId === institutionId);
    if (!targetDraft) return false;

    // Delete associated document from IndexedDB if exists
    if (targetDraft.documentId) {
      await fdrDocumentRepository.deleteDocument(targetDraft.documentId);
    }

    const filtered = drafts.filter((d) => !(d.id === draftId && d.institutionId === institutionId));
    storageService.setItem(STORAGE_KEYS.FDR_DRAFTS, filtered);
    return true;
  },

  /**
   * Officer verification queue query
   */
  async getOfficerQueue(options = {}) {
    const all = await this.getAllFDRs();

    // Default queue excludes drafts
    let queue = all.filter((f) => f.status !== FDR_STATUS.DRAFT);

    if (options.status && options.status !== 'ALL') {
      queue = queue.filter((f) => f.status === options.status);
    }

    if (options.institutionId) {
      queue = queue.filter((f) => f.institutionId === options.institutionId);
    }

    if (options.search) {
      const q = options.search.toLowerCase();
      queue = queue.filter(
        (f) =>
          f.referenceNumber?.toLowerCase().includes(q) ||
          f.fdrNumber?.toLowerCase().includes(q) ||
          f.bankName?.toLowerCase().includes(q)
      );
    }

    // Default: Sort by submission date ascending (oldest pending review first)
    if (options.sortBy === 'recent') {
      queue.sort((a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt));
    } else {
      queue.sort((a, b) => new Date(a.submittedAt || a.createdAt) - new Date(b.submittedAt || b.createdAt));
    }

    return queue;
  },

  /**
   * Initiates a renewal by creating a pre-filled draft linked to the existing FDR
   */
  async initiateRenewal(originalFdrId, actor = {}) {
    const original = await this.getFDRById(originalFdrId);
    if (!original) {
      throw new Error(`Original FDR with ID "${originalFdrId}" not found.`);
    }

    const draftData = {
      bankName: original.bankName,
      branchName: original.branchName,
      branchAddress: original.branchAddress,
      ifsc: original.ifsc,
      accountHolderName: original.accountHolderName,
      depositAmount: (original.depositAmountPaise / 100).toString(),
      depositAmountPaise: original.depositAmountPaise,
      depositType: original.depositType,
      applicableSecurityRequirement: original.applicableSecurityRequirement,
      renewalReferenceId: original.referenceNumber || original.id,
      remarks: `Renewal rollover for prior FDR #${original.fdrNumber} (Ref: ${original.referenceNumber}).`,
    };

    const draft = await this.saveDraft(draftData, original.institutionId);

    // Audit event
    await auditRepository.logEvent({
      eventType: 'RENEWAL_INITIATED',
      actorId: actor.id || 'institution',
      actorRole: 'institution',
      targetEntityId: originalFdrId,
      summary: `Initiated deposit renewal workflow for FDR ${original.referenceNumber}`,
      metadata: { originalFdrId, renewalDraftId: draft.id },
    });

    return draft;
  },

  /**
   * Calculates real-time FDR statistics for an educational institution
   */
  async getInstitutionFdrStats(institutionId) {
    if (!institutionId) {
      return {
        totalRecords: 0,
        submitted: 0,
        underReview: 0,
        accepted: 0,
        rejected: 0,
        clarification: 0,
        upcomingMaturities: 0,
        maturedCount: 0,
        totalDepositPaise: 0,
      };
    }

    const fdrs = await this.getFDRsByInstitution(institutionId);
    const nonDrafts = fdrs.filter((f) => f.status !== FDR_STATUS.DRAFT);

    let upcomingMaturities = 0;
    let maturedCount = 0;
    let totalDepositPaise = 0;

    for (const f of nonDrafts) {
      const days = getDaysUntilMaturity(f.maturityDate);
      if (days < 0) {
        maturedCount++;
      } else if (days <= 90) {
        upcomingMaturities++;
      }

      if (f.status === FDR_STATUS.REVIEW_ACCEPTED) {
        totalDepositPaise += f.depositAmountPaise || 0;
      }
    }

    return {
      totalRecords: nonDrafts.length,
      submitted: nonDrafts.filter((f) => f.status === FDR_STATUS.SUBMITTED).length,
      underReview: nonDrafts.filter((f) => f.status === FDR_STATUS.UNDER_REVIEW).length,
      accepted: nonDrafts.filter((f) => f.status === FDR_STATUS.REVIEW_ACCEPTED).length,
      rejected: nonDrafts.filter((f) => f.status === FDR_STATUS.REVIEW_REJECTED).length,
      clarification: nonDrafts.filter((f) => f.status === FDR_STATUS.CLARIFICATION_REQUIRED).length,
      upcomingMaturities,
      maturedCount,
      totalDepositPaise,
    };
  },

  /**
   * Calculates master FDR telemetry for the System Administrator Dashboard
   */
  async getPlatformFdrStats() {
    const all = await this.getAllFDRs();
    const nonDrafts = all.filter((f) => f.status !== FDR_STATUS.DRAFT);

    const statusCounts = {
      [FDR_STATUS.SUBMITTED]: 0,
      [FDR_STATUS.UNDER_REVIEW]: 0,
      [FDR_STATUS.CLARIFICATION_REQUIRED]: 0,
      [FDR_STATUS.REVIEW_ACCEPTED]: 0,
      [FDR_STATUS.REVIEW_REJECTED]: 0,
    };

    let totalDeclaredDepositPaise = 0;
    let upcomingMaturitiesTotal = 0;
    let maturedTotal = 0;

    for (const f of nonDrafts) {
      if (statusCounts[f.status] !== undefined) {
        statusCounts[f.status]++;
      }
      totalDeclaredDepositPaise += f.depositAmountPaise || 0;

      const days = getDaysUntilMaturity(f.maturityDate);
      if (days < 0) {
        maturedTotal++;
      } else if (days <= 90) {
        upcomingMaturitiesTotal++;
      }
    }

    return {
      totalFDRCount: nonDrafts.length,
      totalDeclaredDepositPaise,
      statusCounts,
      upcomingMaturitiesTotal,
      maturedTotal,
    };
  },
};
