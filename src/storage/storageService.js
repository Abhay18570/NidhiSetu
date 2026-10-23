/**
 * NidhiSetu Storage Service
 * Provides robust, versioned, error-tolerant wrappers around browser localStorage and sessionStorage.
 * Designed with an asynchronous interface to facilitate future REST / GraphQL API migrations.
 */

export const STORAGE_KEYS = {
  USERS: 'nidhisetu_users_v1',
  INSTITUTIONS: 'nidhisetu_institutions_v1',
  SESSION: 'nidhisetu_session_v1',
  AUDIT_LOGS: 'nidhisetu_audit_logs_v1',
  NOTIFICATIONS: 'nidhisetu_notifications_v1',
  METADATA: 'nidhisetu_demo_metadata_v1',
  REG_DRAFT: 'nidhisetu_reg_draft_v1',
  FDR_RECORDS: 'nidhisetu_fdr_records_v1',
  FDR_EVENTS: 'nidhisetu_fdr_events_v1',
  FDR_DRAFTS: 'nidhisetu_fdr_drafts_v1',
  DOCUMENT_ANALYSIS: 'nidhisetu_document_analysis_v1',
  INTELLIGENCE_REVIEWS: 'nidhisetu_intelligence_reviews_v1',
  BANK_REGISTRY: 'nidhisetu_bank_registry_v1',
  BANK_VERIFICATIONS: 'nidhisetu_bank_verifications_v1',
  BANK_MESSAGES: 'nidhisetu_bank_messages_v1',
  BANK_REVIEWS: 'nidhisetu_bank_reviews_v1',
  COMPLIANCE_RULES: 'nidhisetu_compliance_rules_v1',
  COMPLIANCE_ASSESSMENTS: 'nidhisetu_compliance_assessments_v1',
  COMPLIANCE_CASES: 'nidhisetu_compliance_cases_v1',
  COMPLIANCE_REVIEWS: 'nidhisetu_compliance_reviews_v1',
  RENEWAL_PLANS: 'nidhisetu_renewal_plans_v1',
  RENEWAL_REQUESTS: 'nidhisetu_renewal_requests_v1',
  RENEWAL_REVIEWS: 'nidhisetu_renewal_reviews_v1',
  RELEASE_REQUESTS: 'nidhisetu_release_requests_v1',
  RENEWAL_ESCALATIONS: 'nidhisetu_renewal_escalations_v1',
  COMMAND_CENTER_PREFS: 'nidhisetu_command_center_preferences_v1',
  COMMAND_CENTER_SNAPSHOTS: 'nidhisetu_command_center_snapshots_v1',
  OFFICER_ASSIGNMENTS: 'nidhisetu_officer_assignments_v1',
  OPERATIONAL_ALERTS: 'nidhisetu_operational_alerts_v1',
  DEMO_SCENARIOS: 'nidhisetu_demo_scenarios_v1',
};


export const STORAGE_VERSION = '1.0.0-PROTOTYPE';

/**
 * Safely parse JSON with fallback
 */
export function safeJsonParse(jsonString, fallbackValue = null) {
  if (!jsonString || typeof jsonString !== 'string') {
    return fallbackValue;
  }
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    console.warn('[NidhiSetu Storage] Corrupted JSON detected, restoring fallback:', err);
    return fallbackValue;
  }
}

/**
 * Storage service implementation with quota error handling
 */
class StorageService {
  /**
   * Get an item from localStorage or sessionStorage
   */
  getItem(key, fallback = null, isSession = false) {
    try {
      const storage = isSession ? window.sessionStorage : window.localStorage;
      const raw = storage.getItem(key);
      return safeJsonParse(raw, fallback);
    } catch (err) {
      console.error(`[NidhiSetu Storage] Failed to read key "${key}":`, err);
      return fallback;
    }
  }

  /**
   * Set an item in localStorage or sessionStorage
   */
  setItem(key, value, isSession = false) {
    try {
      const storage = isSession ? window.sessionStorage : window.localStorage;
      const serialized = JSON.stringify(value);
      storage.setItem(key, serialized);
      return true;
    } catch (err) {
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        console.error('[NidhiSetu Storage] Storage quota exceeded. Evicting oldest non-critical logs.');
        this._handleQuotaExceeded();
        try {
          const storage = isSession ? window.sessionStorage : window.localStorage;
          storage.setItem(key, JSON.stringify(value));
          return true;
        } catch {
          return false;
        }
      }
      console.error(`[NidhiSetu Storage] Failed to write key "${key}":`, err);
      return false;
    }
  }

  /**
   * Remove an item from both localStorage and sessionStorage
   */
  removeItem(key) {
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
      return true;
    } catch (err) {
      console.error(`[NidhiSetu Storage] Failed to remove key "${key}":`, err);
      return false;
    }
  }

  /**
   * Cleanly evicts older audit logs to preserve space if browser quota is hit
   */
  _handleQuotaExceeded() {
    try {
      const logs = this.getItem(STORAGE_KEYS.AUDIT_LOGS, []);
      if (Array.isArray(logs) && logs.length > 50) {
        // Keep newest 50 logs
        const trimmed = logs.slice(0, 50);
        window.localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(trimmed));
      }
    } catch (err) {
      console.warn('[NidhiSetu Storage] Eviction failed:', err);
    }
  }
}

export const storageService = new StorageService();
