/**
 * NidhiSetu Banking Simulator — Synthetic Bank Registry
 * Manages the synthetic commercial bank directory for client-side lien & deposit verification simulations.
 *
 * NOTE: STRICTLY A SYNTHETIC SIMULATION PROFILE REGISTRY.
 * No real bank APIs, SFMS/CBS connections, or legal bank partnerships are implied.
 */

import { storageService, STORAGE_KEYS } from '../storage/storageService';

export const VERIFICATION_TYPES = {
  FDR_EXISTENCE_CHECK: 'FDR_EXISTENCE_CHECK',
  DEPOSIT_DETAILS_CHECK: 'DEPOSIT_DETAILS_CHECK',
  LIEN_STATUS_CHECK: 'LIEN_STATUS_CHECK',
  MATURITY_STATUS_CHECK: 'MATURITY_STATUS_CHECK',
};

export const SIMULATION_STATUS = {
  ACTIVE_SIMULATOR: 'ACTIVE_SIMULATOR',
  MAINTENANCE_SIMULATOR: 'MAINTENANCE_SIMULATOR',
  TIMEOUT_SIMULATOR: 'TIMEOUT_SIMULATOR',
};

export const DEFAULT_SYNTHETIC_BANKS = [
  {
    bankId: 'sim-bank-sbi',
    displayName: 'State Bank of India (SBI Simulator)',
    shortName: 'SBI',
    bankCode: 'SBIN',
    bankCategory: 'Public Sector Scheduled Commercial Bank',
    headquarters: 'State Bank Bhavan, Madame Cama Road, Mumbai',
    supportedVerificationTypes: [
      VERIFICATION_TYPES.FDR_EXISTENCE_CHECK,
      VERIFICATION_TYPES.DEPOSIT_DETAILS_CHECK,
      VERIFICATION_TYPES.LIEN_STATUS_CHECK,
      VERIFICATION_TYPES.MATURITY_STATUS_CHECK,
    ],
    simulationStatus: SIMULATION_STATUS.ACTIVE_SIMULATOR,
    mockResponseDelay: 600,
    isSyntheticSimulator: true,
    simulationNotice: 'SIMULATED BANK PROFILE — FOR TESTING & SCRUTINY DEMONSTRATION ONLY',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    bankId: 'sim-bank-bob',
    displayName: 'Bank of Baroda (BOB Simulator)',
    shortName: 'BOB',
    bankCode: 'BARB',
    bankCategory: 'Public Sector Scheduled Commercial Bank',
    headquarters: 'Baroda Bhavan, R.C. Dutt Road, Alkapuri, Vadodara',
    supportedVerificationTypes: [
      VERIFICATION_TYPES.FDR_EXISTENCE_CHECK,
      VERIFICATION_TYPES.DEPOSIT_DETAILS_CHECK,
      VERIFICATION_TYPES.LIEN_STATUS_CHECK,
      VERIFICATION_TYPES.MATURITY_STATUS_CHECK,
    ],
    simulationStatus: SIMULATION_STATUS.ACTIVE_SIMULATOR,
    mockResponseDelay: 750,
    isSyntheticSimulator: true,
    simulationNotice: 'SIMULATED BANK PROFILE — FOR TESTING & SCRUTINY DEMONSTRATION ONLY',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    bankId: 'sim-bank-pnb',
    displayName: 'Punjab National Bank (PNB Simulator)',
    shortName: 'PNB',
    bankCode: 'PUNB',
    bankCategory: 'Public Sector Scheduled Commercial Bank',
    headquarters: 'Plot No. 4, Sector 10, Dwarka, New Delhi',
    supportedVerificationTypes: [
      VERIFICATION_TYPES.FDR_EXISTENCE_CHECK,
      VERIFICATION_TYPES.DEPOSIT_DETAILS_CHECK,
      VERIFICATION_TYPES.LIEN_STATUS_CHECK,
      VERIFICATION_TYPES.MATURITY_STATUS_CHECK,
    ],
    simulationStatus: SIMULATION_STATUS.ACTIVE_SIMULATOR,
    mockResponseDelay: 500,
    isSyntheticSimulator: true,
    simulationNotice: 'SIMULATED BANK PROFILE — FOR TESTING & SCRUTINY DEMONSTRATION ONLY',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    bankId: 'sim-bank-canara',
    displayName: 'Canara Bank (Simulator)',
    shortName: 'CANARA',
    bankCode: 'CNRB',
    bankCategory: 'Public Sector Scheduled Commercial Bank',
    headquarters: '112, J.C. Road, Bangalore, Karnataka',
    supportedVerificationTypes: [
      VERIFICATION_TYPES.FDR_EXISTENCE_CHECK,
      VERIFICATION_TYPES.DEPOSIT_DETAILS_CHECK,
      VERIFICATION_TYPES.LIEN_STATUS_CHECK,
      VERIFICATION_TYPES.MATURITY_STATUS_CHECK,
    ],
    simulationStatus: SIMULATION_STATUS.ACTIVE_SIMULATOR,
    mockResponseDelay: 650,
    isSyntheticSimulator: true,
    simulationNotice: 'SIMULATED BANK PROFILE — FOR TESTING & SCRUTINY DEMONSTRATION ONLY',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    bankId: 'sim-bank-hdfc',
    displayName: 'HDFC Bank (Simulator)',
    shortName: 'HDFC',
    bankCode: 'HDFC',
    bankCategory: 'Private Sector Scheduled Commercial Bank',
    headquarters: 'HDFC Bank House, Senapati Bapat Marg, Lower Parel, Mumbai',
    supportedVerificationTypes: [
      VERIFICATION_TYPES.FDR_EXISTENCE_CHECK,
      VERIFICATION_TYPES.DEPOSIT_DETAILS_CHECK,
      VERIFICATION_TYPES.LIEN_STATUS_CHECK,
      VERIFICATION_TYPES.MATURITY_STATUS_CHECK,
    ],
    simulationStatus: SIMULATION_STATUS.ACTIVE_SIMULATOR,
    mockResponseDelay: 450,
    isSyntheticSimulator: true,
    simulationNotice: 'SIMULATED BANK PROFILE — FOR TESTING & SCRUTINY DEMONSTRATION ONLY',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    bankId: 'sim-bank-icici',
    displayName: 'ICICI Bank (Simulator)',
    shortName: 'ICICI',
    bankCode: 'ICIC',
    bankCategory: 'Private Sector Scheduled Commercial Bank',
    headquarters: 'ICICI Bank Towers, Bandra Kurla Complex, Mumbai',
    supportedVerificationTypes: [
      VERIFICATION_TYPES.FDR_EXISTENCE_CHECK,
      VERIFICATION_TYPES.DEPOSIT_DETAILS_CHECK,
      VERIFICATION_TYPES.LIEN_STATUS_CHECK,
      VERIFICATION_TYPES.MATURITY_STATUS_CHECK,
    ],
    simulationStatus: SIMULATION_STATUS.ACTIVE_SIMULATOR,
    mockResponseDelay: 500,
    isSyntheticSimulator: true,
    simulationNotice: 'SIMULATED BANK PROFILE — FOR TESTING & SCRUTINY DEMONSTRATION ONLY',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const bankRegistry = {
  /**
   * Initializes synthetic bank registry in localStorage idempotently
   */
  async initRegistry() {
    const existing = storageService.getItem(STORAGE_KEYS.BANK_REGISTRY, null);
    if (!existing || !Array.isArray(existing) || existing.length === 0) {
      storageService.setItem(STORAGE_KEYS.BANK_REGISTRY, DEFAULT_SYNTHETIC_BANKS);
      return DEFAULT_SYNTHETIC_BANKS;
    }
    return existing;
  },

  /**
   * Retrieves all synthetic bank profiles
   */
  async getAllBanks() {
    const list = storageService.getItem(STORAGE_KEYS.BANK_REGISTRY, null);
    if (!list || !Array.isArray(list) || list.length === 0) {
      return await this.initRegistry();
    }
    return list;
  },

  /**
   * Retrieves a single synthetic bank profile by its ID
   */
  async getBankById(bankId) {
    if (!bankId) return null;
    const all = await this.getAllBanks();
    return all.find((b) => b.bankId === bankId) || null;
  },

  /**
   * Retrieves a synthetic bank profile by IFSC code prefix or bankCode
   */
  async getBankByCodeOrIfsc(codeOrIfsc) {
    if (!codeOrIfsc || typeof codeOrIfsc !== 'string') return null;
    const clean = codeOrIfsc.trim().toUpperCase();
    const all = await this.getAllBanks();

    // Check bankCode match or if IFSC starts with bankCode (e.g. SBIN0001110 -> SBIN)
    return (
      all.find(
        (b) =>
          b.bankCode === clean ||
          clean.startsWith(b.bankCode) ||
          b.shortName === clean ||
          clean.includes(b.shortName)
      ) || all[0]
    );
  },

  /**
   * Resets registry to default synthetic banks
   */
  async resetRegistry() {
    storageService.setItem(STORAGE_KEYS.BANK_REGISTRY, DEFAULT_SYNTHETIC_BANKS);
    return DEFAULT_SYNTHETIC_BANKS;
  },
};
