/**
 * NidhiSetu Storage — Bank Message Repository
 * Persists structured mock financial messages linked to verification requests and correlation IDs.
 *
 * NOTE: PURELY LOCAL MOCK MESSAGING PERSISTENCE.
 */

import { storageService, STORAGE_KEYS } from './storageService';

export const bankMessageRepository = {
  /**
   * Retrieves all mock messages
   */
  async getAllMessages() {
    const list = storageService.getItem(STORAGE_KEYS.BANK_MESSAGES, []);
    return Array.isArray(list) ? list : [];
  },

  /**
   * Saves a message to the repository
   */
  async saveMessage(message) {
    if (!message || !message.messageId) {
      throw new Error('Message must have a valid messageId.');
    }
    const all = await this.getAllMessages();
    const index = all.findIndex((m) => m.messageId === message.messageId);
    if (index >= 0) {
      all[index] = message;
    } else {
      all.push(message);
    }
    storageService.setItem(STORAGE_KEYS.BANK_MESSAGES, all);
    return message;
  },

  /**
   * Retrieves messages for a specific request ID
   */
  async getMessagesByRequestId(requestId) {
    if (!requestId) return [];
    const all = await this.getAllMessages();
    return all.filter((m) => m.requestId === requestId);
  },

  /**
   * Retrieves messages for a specific correlation ID
   */
  async getMessagesByCorrelationId(correlationId) {
    if (!correlationId) return [];
    const all = await this.getAllMessages();
    return all.filter((m) => m.correlationId === correlationId);
  },

  /**
   * Clears all simulated messages (demo reset)
   */
  async clearAll() {
    storageService.setItem(STORAGE_KEYS.BANK_MESSAGES, []);
    return true;
  },
};
