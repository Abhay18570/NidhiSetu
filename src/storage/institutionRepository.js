/**
 * NidhiSetu Institution Repository
 * Manages institutional registration records, profile modifications, and duplicates.
 */

import { storageService, STORAGE_KEYS } from './storageService';

export const institutionRepository = {
  async getAllInstitutions() {
    const list = storageService.getItem(STORAGE_KEYS.INSTITUTIONS, []);
    return Array.isArray(list) ? list : [];
  },

  async getInstitutionById(id) {
    if (!id) return null;
    const list = await this.getAllInstitutions();
    return list.find((inst) => inst.id === id) || null;
  },

  async getInstitutionByAishe(aisheCode) {
    if (!aisheCode) return null;
    const list = await this.getAllInstitutions();
    return (
      list.find((inst) => inst.aisheCode.toLowerCase() === aisheCode.trim().toLowerCase()) || null
    );
  },

  async checkDuplicateEmailOrAishe(email, aisheCode) {
    const list = await this.getAllInstitutions();
    const cleanEmail = email?.trim().toLowerCase();
    const cleanAishe = aisheCode?.trim().toLowerCase();

    let emailExists = false;
    let aisheExists = false;

    for (const inst of list) {
      if (cleanEmail && inst.representativeEmail?.toLowerCase() === cleanEmail) {
        emailExists = true;
      }
      if (cleanAishe && inst.aisheCode?.toLowerCase() === cleanAishe) {
        aisheExists = true;
      }
    }

    return { emailExists, aisheExists };
  },

  async createInstitution(data) {
    const list = await this.getAllInstitutions();

    const duplicates = await this.checkDuplicateEmailOrAishe(
      data.representativeEmail,
      data.aisheCode
    );

    if (duplicates.aisheExists) {
      throw new Error(`An institution with AISHE code "${data.aisheCode}" is already registered.`);
    }

    if (duplicates.emailExists) {
      throw new Error(`An institution with email "${data.representativeEmail}" is already registered.`);
    }

    const newInst = {
      id: data.id || `inst-${crypto.randomUUID().slice(0, 8)}`,
      name: data.name,
      type: data.type || 'Engineering & Technology',
      category: data.category || 'Affiliated Self-Financed College',
      aisheCode: data.aisheCode.trim().toUpperCase(),
      aictePid: data.aictePid ? data.aictePid.trim() : null,
      state: data.state,
      district: data.district,
      city: data.city,
      pincode: data.pincode,
      address: data.address,
      establishmentYear: data.establishmentYear || '2000',
      approvalStatus: data.approvalStatus || 'Self-Declared AICTE Approved',
      regReferenceNo:
        data.regReferenceNo ||
        `REG-${(data.state || 'IN').slice(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'active',
      representativeName: data.representativeName,
      representativeDesignation: data.representativeDesignation,
      representativeEmail: data.representativeEmail.trim().toLowerCase(),
      representativePhone: data.representativePhone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fdrSummary: {
        totalRecords: 0,
        verifiedRecords: 0,
        pendingVerification: 0,
        upcomingRenewals: 0,
        totalDepositValue: '₹ 0 /-',
      },
    };

    const updated = [newInst, ...list];
    storageService.setItem(STORAGE_KEYS.INSTITUTIONS, updated);
    return newInst;
  },

  async updateInstitution(id, updates) {
    const list = await this.getAllInstitutions();
    const index = list.findIndex((inst) => inst.id === id);
    if (index === -1) {
      throw new Error(`Institution with ID "${id}" not found.`);
    }

    const existing = list[index];
    const updatedInst = {
      ...existing,
      ...updates,
      id: existing.id, // Primary ID is immutable
      aisheCode: existing.aisheCode, // AISHE code is immutable once issued
      updatedAt: new Date().toISOString(),
    };

    list[index] = updatedInst;
    storageService.setItem(STORAGE_KEYS.INSTITUTIONS, list);
    return updatedInst;
  },
};
