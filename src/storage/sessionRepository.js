/**
 * NidhiSetu Session Repository
 * Manages active browser sessions.
 * Supports tab-only sessions via sessionStorage and remembered sessions via localStorage.
 * Client-side browser storage can be manipulated; this is a simulated session mechanism for prototype demonstration.
 */

import { storageService, STORAGE_KEYS } from './storageService';

const REMEMBERED_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 Hours
const TAB_EXPIRY_MS = 4 * 60 * 60 * 1000; // 4 Hours

export const sessionRepository = {
  /**
   * Reads the active session from sessionStorage or localStorage
   */
  async getSession() {
    // Check sessionStorage first
    let session = storageService.getItem(STORAGE_KEYS.SESSION, null, true);
    let isRemembered = false;

    // Fallback to localStorage if not found in tab session
    if (!session) {
      session = storageService.getItem(STORAGE_KEYS.SESSION, null, false);
      if (session) {
        isRemembered = true;
      }
    }

    if (!session) {
      return null;
    }

    // Verify session expiration
    if (this.isSessionExpired(session)) {
      await this.clearSession();
      return null;
    }

    return { ...session, isRemembered };
  },

  async getActiveSession() {
    return this.getSession();
  },

  isSessionExpired(session) {
    if (!session || !session.expiresAt) return true;
    const now = Date.now();
    const expiry = new Date(session.expiresAt).getTime();
    return now > expiry;
  },

  /**
   * Stores session into the appropriate storage medium
   */
  async saveSession(user, institution = null, rememberMe = false) {
    const duration = rememberMe ? REMEMBERED_EXPIRY_MS : TAB_EXPIRY_MS;
    const sessionData = {
      token: `sim-tok-${crypto.randomUUID().replace(/-/g, '')}`,
      userId: user.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        institutionId: user.institutionId,
        status: user.status,
      },
      institution: institution ? {
        id: institution.id,
        name: institution.name,
        aisheCode: institution.aisheCode,
        aictePid: institution.aictePid,
        state: institution.state,
        approvalStatus: institution.approvalStatus,
      } : null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + duration).toISOString(),
      rememberMe: Boolean(rememberMe),
    };

    // Clear prior sessions across both mediums
    storageService.removeItem(STORAGE_KEYS.SESSION);

    // Save into chosen storage
    storageService.setItem(STORAGE_KEYS.SESSION, sessionData, !rememberMe);

    return sessionData;
  },

  /**
   * Clears the session from both sessionStorage and localStorage
   */
  async clearSession() {
    storageService.removeItem(STORAGE_KEYS.SESSION);
    return true;
  },
};
