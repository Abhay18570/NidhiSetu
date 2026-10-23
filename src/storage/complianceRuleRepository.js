/**
 * NidhiSetu Storage — Compliance Rule Repository
 * Manages regulatory rule configuration, versioning, activation, and conflict prevention.
 *
 * Rules:
 * - Minimum amount cannot be negative.
 * - Activated rules become immutable (cannot edit in place, must clone into new draft version).
 * - Conflicting active rules are prevented upon activation.
 * - Retiring a rule preserves historical references.
 * - All changes logged to auditRepository.
 */

import { storageService, STORAGE_KEYS } from './storageService';
import { auditRepository } from './auditRepository';
import {
  RULE_STATUSES,
  validateComplianceRule,
  areRulesConflicting,
} from '../compliance/complianceRuleModel';
import { SYNTHETIC_DEMO_RULES } from '../compliance/complianceDemoFixtures';

export const complianceRuleRepository = {
  /**
   * Retrieves all compliance rules, seeding defaults if empty
   */
  async getAllRules() {
    let rules = storageService.getItem(STORAGE_KEYS.COMPLIANCE_RULES, null);
    if (!rules || !Array.isArray(rules) || rules.length === 0) {
      rules = [...SYNTHETIC_DEMO_RULES];
      storageService.setItem(STORAGE_KEYS.COMPLIANCE_RULES, rules);
    }
    return rules;
  },

  /**
   * Retrieves rule by ID
   */
  async getRuleById(ruleId) {
    if (!ruleId) return null;
    const all = await this.getAllRules();
    return all.find((r) => r.ruleId === ruleId) || null;
  },

  /**
   * Retrieves all active rules
   */
  async getActiveRules() {
    const all = await this.getAllRules();
    return all.filter((r) => r.ruleStatus === RULE_STATUSES.ACTIVE);
  },

  /**
   * Creates a new rule in DRAFT status
   */
  async createRule(ruleData, actorId = 'admin-user') {
    const validation = validateComplianceRule(ruleData);
    if (!validation.valid) {
      throw new Error(`Rule validation failed: ${validation.errors.join('; ')}`);
    }

    const all = await this.getAllRules();

    // Check duplicate ruleCode
    const existingCode = all.find(
      (r) => r.ruleCode.trim().toUpperCase() === ruleData.ruleCode.trim().toUpperCase()
    );
    if (existingCode) {
      throw new Error(`Rule with code "${ruleData.ruleCode}" already exists.`);
    }

    const now = new Date().toISOString();
    const newRule = {
      ...ruleData,
      ruleId: ruleData.ruleId || `RULE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      ruleVersion: ruleData.ruleVersion || 1,
      ruleStatus: ruleData.ruleStatus || RULE_STATUSES.DRAFT,
      createdAt: now,
      updatedAt: now,
    };

    all.push(newRule);
    storageService.setItem(STORAGE_KEYS.COMPLIANCE_RULES, all);

    await auditRepository.logEvent({
      eventType: 'COMPLIANCE_RULE_CREATED',
      actorId,
      actorRole: 'admin',
      targetEntityId: newRule.ruleId,
      summary: `Created compliance rule: ${newRule.ruleCode} (${newRule.title})`,
      metadata: { ruleCode: newRule.ruleCode, status: newRule.ruleStatus },
    });

    return newRule;
  },

  /**
   * Updates an existing DRAFT rule. Activated rules are immutable.
   */
  async updateDraftRule(ruleId, updates, actorId = 'admin-user') {
    const all = await this.getAllRules();
    const index = all.findIndex((r) => r.ruleId === ruleId);
    if (index === -1) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    const existing = all[index];
    if (existing.ruleStatus !== RULE_STATUSES.DRAFT) {
      throw new Error(
        `Immutable rule: Rule "${existing.ruleCode}" is ${existing.ruleStatus}. Only DRAFT rules can be modified. Clone this rule to create a new draft version.`
      );
    }

    const merged = {
      ...existing,
      ...updates,
      ruleId: existing.ruleId, // ID cannot change
      ruleVersion: existing.ruleVersion,
      ruleStatus: RULE_STATUSES.DRAFT, // status changes handled via explicit methods
      updatedAt: new Date().toISOString(),
    };

    const validation = validateComplianceRule(merged);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
    }

    all[index] = merged;
    storageService.setItem(STORAGE_KEYS.COMPLIANCE_RULES, all);

    await auditRepository.logEvent({
      eventType: 'COMPLIANCE_RULE_UPDATED',
      actorId,
      actorRole: 'admin',
      targetEntityId: ruleId,
      summary: `Updated draft compliance rule: ${merged.ruleCode}`,
      metadata: { updates },
    });

    return merged;
  },

  /**
   * Activates a rule after validating no conflicts with other active rules.
   */
  async activateRule(ruleId, actorId = 'admin-user') {
    const all = await this.getAllRules();
    const target = all.find((r) => r.ruleId === ruleId);
    if (!target) throw new Error(`Rule not found: ${ruleId}`);

    if (target.ruleStatus === RULE_STATUSES.ACTIVE) {
      return target; // already active
    }

    // Check for conflicting active rules
    const activeRules = all.filter((r) => r.ruleStatus === RULE_STATUSES.ACTIVE);
    for (const active of activeRules) {
      if (areRulesConflicting(target, active)) {
        throw new Error(
          `Conflict detected: Cannot activate rule "${target.ruleCode}". It conflicts with existing active rule "${active.ruleCode}" (${active.title}) covering overlapping applicability dates.`
        );
      }
    }

    target.ruleStatus = RULE_STATUSES.ACTIVE;
    target.updatedAt = new Date().toISOString();

    storageService.setItem(STORAGE_KEYS.COMPLIANCE_RULES, all);

    await auditRepository.logEvent({
      eventType: 'COMPLIANCE_RULE_ACTIVATED',
      actorId,
      actorRole: 'admin',
      targetEntityId: ruleId,
      summary: `Activated compliance rule: ${target.ruleCode}`,
      metadata: { ruleCode: target.ruleCode },
    });

    return target;
  },

  /**
   * Retires an active or draft rule. Does not delete historical record.
   */
  async retireRule(ruleId, reason = 'Administrative retirement', actorId = 'admin-user') {
    const all = await this.getAllRules();
    const target = all.find((r) => r.ruleId === ruleId);
    if (!target) throw new Error(`Rule not found: ${ruleId}`);

    target.ruleStatus = RULE_STATUSES.RETIRED;
    target.retirementReason = reason;
    target.retiredAt = new Date().toISOString();
    target.updatedAt = new Date().toISOString();

    storageService.setItem(STORAGE_KEYS.COMPLIANCE_RULES, all);

    await auditRepository.logEvent({
      eventType: 'COMPLIANCE_RULE_RETIRED',
      actorId,
      actorRole: 'admin',
      targetEntityId: ruleId,
      summary: `Retired compliance rule: ${target.ruleCode} (${reason})`,
      metadata: { reason },
    });

    return target;
  },

  /**
   * Clones a rule into a new DRAFT version.
   */
  async cloneRule(ruleId, actorId = 'admin-user') {
    const original = await this.getRuleById(ruleId);
    if (!original) throw new Error(`Rule not found: ${ruleId}`);

    const newVersion = (original.ruleVersion || 1) + 1;
    const now = new Date().toISOString();

    const draft = {
      ...original,
      ruleId: `RULE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      ruleCode: `${original.ruleCode.split('-V')[0]}-V${newVersion}`,
      title: `${original.title} (v${newVersion} Draft)`,
      ruleVersion: newVersion,
      ruleStatus: RULE_STATUSES.DRAFT,
      parentRuleId: original.ruleId,
      createdAt: now,
      updatedAt: now,
    };

    const all = await this.getAllRules();
    all.push(draft);
    storageService.setItem(STORAGE_KEYS.COMPLIANCE_RULES, all);

    await auditRepository.logEvent({
      eventType: 'COMPLIANCE_RULE_CLONED',
      actorId,
      actorRole: 'admin',
      targetEntityId: draft.ruleId,
      summary: `Cloned rule ${original.ruleCode} into new draft version v${newVersion}`,
      metadata: { originalRuleId: original.ruleId, newRuleId: draft.ruleId },
    });

    return draft;
  },

  /**
   * Deletes a rule only if it is in DRAFT status.
   */
  async deleteDraftRule(ruleId, actorId = 'admin-user') {
    const all = await this.getAllRules();
    const target = all.find((r) => r.ruleId === ruleId);
    if (!target) return;

    if (target.ruleStatus !== RULE_STATUSES.DRAFT) {
      throw new Error(`Cannot delete ${target.ruleStatus} rule. Only DRAFT rules can be deleted.`);
    }

    const filtered = all.filter((r) => r.ruleId !== ruleId);
    storageService.setItem(STORAGE_KEYS.COMPLIANCE_RULES, filtered);

    await auditRepository.logEvent({
      eventType: 'COMPLIANCE_RULE_DELETED',
      actorId,
      actorRole: 'admin',
      targetEntityId: ruleId,
      summary: `Deleted draft compliance rule: ${target.ruleCode}`,
    });
  },

  /**
   * Resets rules to demo fixtures
   */
  async resetToDemoRules() {
    storageService.setItem(STORAGE_KEYS.COMPLIANCE_RULES, [...SYNTHETIC_DEMO_RULES]);
  },
};
