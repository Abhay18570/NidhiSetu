/**
 * NidhiSetu Storage — Document Analysis Repository
 * Manages persistent storage, history tracking, and stale detection for OCR extractions,
 * cross-field validations, and explainable anomaly reports.
 */

import { storageService, STORAGE_KEYS } from './storageService';
import { ANALYSIS_STATUS } from '../intelligence/analysisModel';

export const documentAnalysisRepository = {
  /**
   * Retrieves all document analysis reports from localStorage
   */
  async getAllAnalyses() {
    const list = storageService.getItem(STORAGE_KEYS.DOCUMENT_ANALYSIS, []);
    return Array.isArray(list) ? list : [];
  },

  /**
   * Retrieves a single analysis record by its unique analysis ID
   */
  async getAnalysisById(analysisId) {
    if (!analysisId) return null;
    const all = await this.getAllAnalyses();
    return all.find((a) => a.analysisId === analysisId) || null;
  },

  /**
   * Retrieves all historical analyses for a specific FDR ID (newest first)
   */
  async getAnalysisHistoryByFdrId(fdrId) {
    if (!fdrId) return [];
    const all = await this.getAllAnalyses();
    return all
      .filter((a) => a.fdrId === fdrId)
      .sort((a, b) => new Date(b.analyzedAt || 0) - new Date(a.analyzedAt || 0));
  },

  /**
   * Retrieves the most recent active analysis for a given FDR ID
   */
  async getLatestAnalysisByFdrId(fdrId) {
    const history = await this.getAnalysisHistoryByFdrId(fdrId);
    return history[0] || null;
  },

  /**
   * Retrieves all analyses belonging to a specific institution
   */
  async getAnalysesByInstitution(institutionId) {
    if (!institutionId) return [];
    const all = await this.getAllAnalyses();
    return all.filter((a) => a.institutionId === institutionId);
  },

  /**
   * Saves a new analysis report to history without destroying previous reports.
   * If an analysis with the exact same analysisId exists, it is updated in place.
   */
  async saveAnalysis(report) {
    if (!report || !report.fdrId) {
      throw new Error('Valid analysis report with fdrId is required.');
    }

    const all = await this.getAllAnalyses();
    const existingIndex = all.findIndex((a) => a.analysisId === report.analysisId);

    let updatedList;
    if (existingIndex >= 0) {
      updatedList = [...all];
      updatedList[existingIndex] = { ...report, updatedAt: new Date().toISOString() };
    } else {
      updatedList = [report, ...all];
    }

    storageService.setItem(STORAGE_KEYS.DOCUMENT_ANALYSIS, updatedList);
    return report;
  },

  /**
   * Marks previous analyses for an FDR as STALE (e.g. when a document is re-uploaded)
   */
  async markStale(fdrId, reason = 'Document was replaced or updated') {
    if (!fdrId) return;
    const all = await this.getAllAnalyses();
    let changed = false;

    const updated = all.map((a) => {
      if (a.fdrId === fdrId && a.processingStatus !== ANALYSIS_STATUS.STALE) {
        changed = true;
        return {
          ...a,
          processingStatus: ANALYSIS_STATUS.STALE,
          staleReason: reason,
          staleAt: new Date().toISOString(),
        };
      }
      return a;
    });

    if (changed) {
      storageService.setItem(STORAGE_KEYS.DOCUMENT_ANALYSIS, updated);
    }
  },

  /**
   * Evaluates if a given analysis is stale compared to current FDR metadata
   */
  isAnalysisStale(analysis, currentFdr) {
    if (!analysis || !currentFdr) return true;
    if (analysis.processingStatus === ANALYSIS_STATUS.STALE) return true;
    if (!currentFdr.sha256Hash) return false;
    // If the document hash in the FDR record differs from when analysis was run
    if (analysis.documentSha256 && analysis.documentSha256 !== currentFdr.sha256Hash) {
      return true;
    }
    return false;
  },

  /**
   * Deletes a specific analysis record
   */
  async deleteAnalysis(analysisId) {
    if (!analysisId) return;
    const all = await this.getAllAnalyses();
    const filtered = all.filter((a) => a.analysisId !== analysisId);
    storageService.setItem(STORAGE_KEYS.DOCUMENT_ANALYSIS, filtered);
  },

  /**
   * Removes all document analyses (test/demo cleanup)
   */
  async clearAllAnalyses() {
    storageService.removeItem(STORAGE_KEYS.DOCUMENT_ANALYSIS);
  },
};
