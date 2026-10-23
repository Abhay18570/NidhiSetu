/**
 * NidhiSetu Storage — Compliance Assessment Repository
 * Stores immutable compliance assessment snapshots, manages reassessment lineage,
 * and tracks assessment freshness / staleness.
 */

import { storageService, STORAGE_KEYS } from './storageService';
import { auditRepository } from './auditRepository';
import { notificationRepository } from './notificationRepository';
import { ASSESSMENT_STATUS } from '../compliance/complianceAssessmentBuilder';

export const complianceAssessmentRepository = {
  /**
   * Retrieves all assessments from storage
   */
  async getAllAssessments() {
    const list = storageService.getItem(STORAGE_KEYS.COMPLIANCE_ASSESSMENTS, []);
    return Array.isArray(list) ? list : [];
  },

  /**
   * Retrieves a specific assessment by ID
   */
  async getAssessmentById(assessmentId) {
    if (!assessmentId) return null;
    const all = await this.getAllAssessments();
    return all.find((a) => a.assessmentId === assessmentId) || null;
  },

  /**
   * Retrieves all historical assessments for an institution (newest first)
   */
  async getAssessmentsByInstitutionId(institutionId) {
    if (!institutionId) return [];
    const all = await this.getAllAssessments();
    return all
      .filter((a) => String(a.institutionId) === String(institutionId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  /**
   * Retrieves latest assessment for an institution
   */
  async getLatestAssessmentForInstitution(institutionId) {
    const history = await this.getAssessmentsByInstitutionId(institutionId);
    return history[0] || null;
  },

  /**
   * Saves a new compliance assessment snapshot.
   * If a previous assessment exists for this institution, marks previous as STALE
   * and preserves the lineage link.
   */
  async saveAssessment(assessment, actorId = 'system-evaluator') {
    if (!assessment || !assessment.institutionId) {
      throw new Error('Valid compliance assessment with institutionId is required.');
    }

    const all = await this.getAllAssessments();

    // Mark previous active assessments for this institution as STALE
    const updatedAll = all.map((existing) => {
      if (
        String(existing.institutionId) === String(assessment.institutionId) &&
        existing.assessmentStatus !== ASSESSMENT_STATUS.STALE
      ) {
        return {
          ...existing,
          assessmentStatus: ASSESSMENT_STATUS.STALE,
          staleReason: `Superseded by newer assessment snapshot (${assessment.assessmentId}).`,
          staleAt: new Date().toISOString(),
        };
      }
      return existing;
    });

    // Add new assessment to front
    const updatedList = [assessment, ...updatedAll];
    storageService.setItem(STORAGE_KEYS.COMPLIANCE_ASSESSMENTS, updatedList);

    // Audit logging
    await auditRepository.logEvent({
      eventType: 'COMPLIANCE_ASSESSMENT_GENERATED',
      actorId,
      actorRole: 'officer',
      targetEntityId: assessment.assessmentId,
      summary: `Completed compliance assessment for ${assessment.institutionName || assessment.institutionId} (Status: ${assessment.adequacyStatus}, Priority: ${assessment.overallPriority})`,
      metadata: {
        institutionId: assessment.institutionId,
        adequacyStatus: assessment.adequacyStatus,
        shortfallPaise: assessment.shortfallPaise,
        overallPriority: assessment.overallPriority,
        inputFingerprint: assessment.inputFingerprint,
      },
    });

    // In-app notifications
    // 1. Officer notification
    await notificationRepository.createNotification({
      role: 'officer',
      title: 'Compliance Assessment Completed',
      message: `Assessment ${assessment.assessmentId} completed for ${assessment.institutionName || assessment.institutionId}. Overall Priority: ${assessment.overallPriority}.`,
      category: 'compliance',
    });

    // 2. Institution notification if shortfall
    if (assessment.shortfallPaise > 0) {
      await notificationRepository.createNotification({
        role: 'institution',
        userId: assessment.institutionId,
        title: 'Security Deposit Shortfall Notice',
        message: `Regulatory assessment indicates a declared deposit shortfall of ₹${(assessment.shortfallPaise / 100).toLocaleString('en-IN')}. Please review compliance status.`,
        category: 'compliance',
      });
    }

    return assessment;
  },

  /**
   * Explicitly marks current assessment for an institution as STALE
   * (e.g. when an FDR is uploaded, modified, or lifecycle changes).
   */
  async markStale(institutionId, reason = 'FDR deposit data or regulatory rules have been modified') {
    if (!institutionId) return;
    const all = await this.getAllAssessments();
    let marked = false;

    const updated = all.map((a) => {
      if (
        String(a.institutionId) === String(institutionId) &&
        a.assessmentStatus !== ASSESSMENT_STATUS.STALE
      ) {
        marked = true;
        return {
          ...a,
          assessmentStatus: ASSESSMENT_STATUS.STALE,
          staleReason: reason,
          staleAt: new Date().toISOString(),
        };
      }
      return a;
    });

    if (marked) {
      storageService.setItem(STORAGE_KEYS.COMPLIANCE_ASSESSMENTS, updated);
      await notificationRepository.createNotification({
        role: 'officer',
        title: 'Compliance Assessment Stale',
        message: `Compliance assessment for institution ${institutionId} is now stale: ${reason}. Reassessment recommended.`,
        category: 'compliance',
      });
    }
  },

  /**
   * Resets assessments storage (for test / demo reset)
   */
  async clearAllAssessments() {
    storageService.removeItem(STORAGE_KEYS.COMPLIANCE_ASSESSMENTS);
  },
};
