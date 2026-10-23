/**
 * NidhiSetu Storage Migrations & Initializer
 * Idempotently initializes and manages storage schema versioning.
 * Preserves user modifications while ensuring baseline demo data exists.
 */

import { storageService, STORAGE_KEYS, STORAGE_VERSION } from './storageService';
import {
  DEMO_USERS,
  DEMO_INSTITUTIONS,
  DEMO_NOTIFICATIONS,
  DEMO_AUDIT_LOGS,
} from './demoData';
import { DEMO_FDR_RECORDS, DEMO_FDR_EVENTS } from './fdrDemoData';
import { DEFAULT_SYNTHETIC_BANKS } from '../banking/bankRegistry';
import { DEMO_BANK_VERIFICATIONS, DEMO_BANK_REVIEWS } from './bankDemoData';
import { SYNTHETIC_DEMO_RULES } from '../compliance/complianceDemoFixtures';
import {
  DEMO_RENEWAL_REQUESTS,
  DEMO_RELEASE_REQUESTS,
  DEMO_RENEWAL_ESCALATIONS,
} from '../renewal/renewalDemoFixtures';
import {
  DEMO_OPERATIONAL_ALERTS,
  DEMO_OFFICER_ASSIGNMENTS,
  DEMO_SCENARIOS,
} from '../commandCenter/commandCenterDemoFixtures';

export function initializeStorage(forceReset = false) {
  try {
    const meta = storageService.getItem(STORAGE_KEYS.METADATA, null);

    if (forceReset || !meta || meta.version !== STORAGE_VERSION) {
      if (forceReset || !storageService.getItem(STORAGE_KEYS.USERS)) {
        storageService.setItem(STORAGE_KEYS.USERS, DEMO_USERS);
      }
      if (forceReset || !storageService.getItem(STORAGE_KEYS.INSTITUTIONS)) {
        storageService.setItem(STORAGE_KEYS.INSTITUTIONS, DEMO_INSTITUTIONS);
      }
      if (forceReset || !storageService.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
        storageService.setItem(STORAGE_KEYS.NOTIFICATIONS, DEMO_NOTIFICATIONS);
      }
      if (forceReset || !storageService.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
        storageService.setItem(STORAGE_KEYS.AUDIT_LOGS, DEMO_AUDIT_LOGS);
      }
      if (forceReset || !storageService.getItem(STORAGE_KEYS.FDR_RECORDS)) {
        storageService.setItem(STORAGE_KEYS.FDR_RECORDS, DEMO_FDR_RECORDS);
      }
      if (forceReset || !storageService.getItem(STORAGE_KEYS.FDR_EVENTS)) {
        storageService.setItem(STORAGE_KEYS.FDR_EVENTS, DEMO_FDR_EVENTS);
      }
      if (forceReset || !storageService.getItem(STORAGE_KEYS.BANK_REGISTRY)) {
        storageService.setItem(STORAGE_KEYS.BANK_REGISTRY, DEFAULT_SYNTHETIC_BANKS);
      }
      if (forceReset || !storageService.getItem(STORAGE_KEYS.BANK_VERIFICATIONS)) {
        storageService.setItem(STORAGE_KEYS.BANK_VERIFICATIONS, DEMO_BANK_VERIFICATIONS);
      }
      if (forceReset || !storageService.getItem(STORAGE_KEYS.BANK_REVIEWS)) {
        storageService.setItem(STORAGE_KEYS.BANK_REVIEWS, DEMO_BANK_REVIEWS);
      }
      if (forceReset || !storageService.getItem(STORAGE_KEYS.COMPLIANCE_RULES)) {
        storageService.setItem(STORAGE_KEYS.COMPLIANCE_RULES, SYNTHETIC_DEMO_RULES);
      }
      if (forceReset || !storageService.getItem(STORAGE_KEYS.RENEWAL_REQUESTS)) {
        storageService.setItem(STORAGE_KEYS.RENEWAL_REQUESTS, DEMO_RENEWAL_REQUESTS);
      }
      if (forceReset || !storageService.getItem(STORAGE_KEYS.RELEASE_REQUESTS)) {
        storageService.setItem(STORAGE_KEYS.RELEASE_REQUESTS, DEMO_RELEASE_REQUESTS);
      }
      if (forceReset || !storageService.getItem(STORAGE_KEYS.RENEWAL_ESCALATIONS)) {
        storageService.setItem(STORAGE_KEYS.RENEWAL_ESCALATIONS, DEMO_RENEWAL_ESCALATIONS);
      }
      if (forceReset || !storageService.getItem(STORAGE_KEYS.OPERATIONAL_ALERTS)) {
        storageService.setItem(STORAGE_KEYS.OPERATIONAL_ALERTS, DEMO_OPERATIONAL_ALERTS);
      }
      if (forceReset || !storageService.getItem(STORAGE_KEYS.OFFICER_ASSIGNMENTS)) {
        storageService.setItem(STORAGE_KEYS.OFFICER_ASSIGNMENTS, DEMO_OFFICER_ASSIGNMENTS);
      }
      if (forceReset || !storageService.getItem(STORAGE_KEYS.DEMO_SCENARIOS)) {
        storageService.setItem(STORAGE_KEYS.DEMO_SCENARIOS, DEMO_SCENARIOS);
      }


      storageService.setItem(STORAGE_KEYS.METADATA, {
        version: STORAGE_VERSION,
        initializedAt: new Date().toISOString(),
        lastResetAt: forceReset ? new Date().toISOString() : (meta?.lastResetAt || null),
      });

      console.info(`[NidhiSetu Storage] Storage initialized successfully (version ${STORAGE_VERSION}).`);
      return true;
    }

    // Ensure baseline records exist if partially wiped
    const existingUsers = storageService.getItem(STORAGE_KEYS.USERS, []);
    if (!Array.isArray(existingUsers) || existingUsers.length === 0) {
      storageService.setItem(STORAGE_KEYS.USERS, DEMO_USERS);
    }

    const existingInsts = storageService.getItem(STORAGE_KEYS.INSTITUTIONS, []);
    if (!Array.isArray(existingInsts) || existingInsts.length === 0) {
      storageService.setItem(STORAGE_KEYS.INSTITUTIONS, DEMO_INSTITUTIONS);
    }

    const existingFdrs = storageService.getItem(STORAGE_KEYS.FDR_RECORDS, []);
    if (!Array.isArray(existingFdrs) || existingFdrs.length === 0) {
      storageService.setItem(STORAGE_KEYS.FDR_RECORDS, DEMO_FDR_RECORDS);
    }

    const existingEvents = storageService.getItem(STORAGE_KEYS.FDR_EVENTS, []);
    if (!Array.isArray(existingEvents) || existingEvents.length === 0) {
      storageService.setItem(STORAGE_KEYS.FDR_EVENTS, DEMO_FDR_EVENTS);
    }

    const existingBankReg = storageService.getItem(STORAGE_KEYS.BANK_REGISTRY, []);
    if (!Array.isArray(existingBankReg) || existingBankReg.length === 0) {
      storageService.setItem(STORAGE_KEYS.BANK_REGISTRY, DEFAULT_SYNTHETIC_BANKS);
    }

    const existingVerifs = storageService.getItem(STORAGE_KEYS.BANK_VERIFICATIONS, []);
    if (!Array.isArray(existingVerifs) || existingVerifs.length === 0) {
      storageService.setItem(STORAGE_KEYS.BANK_VERIFICATIONS, DEMO_BANK_VERIFICATIONS);
    }

    const existingReviews = storageService.getItem(STORAGE_KEYS.BANK_REVIEWS, []);
    if (!Array.isArray(existingReviews) || existingReviews.length === 0) {
      storageService.setItem(STORAGE_KEYS.BANK_REVIEWS, DEMO_BANK_REVIEWS);
    }

    const existingRules = storageService.getItem(STORAGE_KEYS.COMPLIANCE_RULES, []);
    if (!Array.isArray(existingRules) || existingRules.length === 0) {
      storageService.setItem(STORAGE_KEYS.COMPLIANCE_RULES, SYNTHETIC_DEMO_RULES);
    }

    const existingRenewals = storageService.getItem(STORAGE_KEYS.RENEWAL_REQUESTS, []);
    if (!Array.isArray(existingRenewals) || existingRenewals.length === 0) {
      storageService.setItem(STORAGE_KEYS.RENEWAL_REQUESTS, DEMO_RENEWAL_REQUESTS);
    }

    const existingReleases = storageService.getItem(STORAGE_KEYS.RELEASE_REQUESTS, []);
    if (!Array.isArray(existingReleases) || existingReleases.length === 0) {
      storageService.setItem(STORAGE_KEYS.RELEASE_REQUESTS, DEMO_RELEASE_REQUESTS);
    }

    const existingEscalations = storageService.getItem(STORAGE_KEYS.RENEWAL_ESCALATIONS, []);
    if (!Array.isArray(existingEscalations) || existingEscalations.length === 0) {
      storageService.setItem(STORAGE_KEYS.RENEWAL_ESCALATIONS, DEMO_RENEWAL_ESCALATIONS);
    }

    const existingAlerts = storageService.getItem(STORAGE_KEYS.OPERATIONAL_ALERTS, []);
    if (!Array.isArray(existingAlerts) || existingAlerts.length === 0) {
      storageService.setItem(STORAGE_KEYS.OPERATIONAL_ALERTS, DEMO_OPERATIONAL_ALERTS);
    }

    const existingAssignments = storageService.getItem(STORAGE_KEYS.OFFICER_ASSIGNMENTS, []);
    if (!Array.isArray(existingAssignments) || existingAssignments.length === 0) {
      storageService.setItem(STORAGE_KEYS.OFFICER_ASSIGNMENTS, DEMO_OFFICER_ASSIGNMENTS);
    }

    const existingScenarios = storageService.getItem(STORAGE_KEYS.DEMO_SCENARIOS, []);
    if (!Array.isArray(existingScenarios) || existingScenarios.length === 0) {
      storageService.setItem(STORAGE_KEYS.DEMO_SCENARIOS, DEMO_SCENARIOS);
    }

    return true;

  } catch (err) {
    console.error('[NidhiSetu Storage] Storage initialization failed:', err);
    return false;
  }
}

export function resetDemoState() {
  initializeStorage(true);
}
