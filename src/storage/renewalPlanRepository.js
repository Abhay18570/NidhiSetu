/**
 * NidhiSetu Storage — Renewal Plan Repository
 * Stores and queries calculated renewal plans for institutions and system officers.
 */

import { storageService, STORAGE_KEYS } from './storageService';
import { generateRenewalPlans } from '../renewal/renewalPlanner';

export const renewalPlanRepository = {
  /**
   * Retrieves all calculated renewal plans
   */
  async getAllPlans() {
    const list = storageService.getItem(STORAGE_KEYS.RENEWAL_PLANS, []);
    return Array.isArray(list) ? list : [];
  },

  /**
   * Retrieves renewal plans for a specific institution
   */
  async getPlansByInstitutionId(institutionId) {
    if (!institutionId) return [];
    const all = await this.getAllPlans();
    return all.filter((p) => String(p.institutionId) === String(institutionId));
  },

  /**
   * Recomputes and caches renewal plans from FDRs and active renewal requests
   */
  async refreshPlans(fdrs = [], requests = [], referenceDate = new Date()) {
    const computedPlans = generateRenewalPlans(fdrs, requests, referenceDate);
    storageService.setItem(STORAGE_KEYS.RENEWAL_PLANS, computedPlans);
    return computedPlans;
  },
};
