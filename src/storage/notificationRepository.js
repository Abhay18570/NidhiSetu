/**
 * NidhiSetu Notification Repository
 * Manages prototype notifications for institutions, officers, and administrators.
 */

import { storageService, STORAGE_KEYS } from './storageService';

export const notificationRepository = {
  async getNotificationsForUser(userId, role) {
    const list = storageService.getItem(STORAGE_KEYS.NOTIFICATIONS, []);
    if (!Array.isArray(list)) return [];

    return list
      .filter((n) => n.userId === userId || (!n.userId && (!role || n.role === role)))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getUserNotifications(userId, role) {
    return this.getNotificationsForUser(userId, role);
  },

  async getNotificationsForRole(role) {
    const list = storageService.getItem(STORAGE_KEYS.NOTIFICATIONS, []);
    if (!Array.isArray(list)) return [];
    return list
      .filter((n) => n.role === role)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getUnreadCount(role, userId = null) {
    const list = await this.getNotificationsForRole(role);
    return list.filter((n) => !n.isRead && (!userId || n.userId === userId)).length;
  },

  async markAsRead(notificationId) {
    const list = storageService.getItem(STORAGE_KEYS.NOTIFICATIONS, []);
    if (!Array.isArray(list)) return false;

    const updated = list.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n));
    storageService.setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
    return true;
  },

  async markAllAsRead(userIdOrRole = null, role = null) {
    const list = storageService.getItem(STORAGE_KEYS.NOTIFICATIONS, []);
    if (!Array.isArray(list)) return false;

    const targetRole = role || (['institution', 'officer', 'admin'].includes(userIdOrRole) ? userIdOrRole : null);
    const targetUserId = role ? userIdOrRole : (targetRole ? null : userIdOrRole);

    const updated = list.map((n) => {
      const roleMatches = targetRole ? n.role === targetRole : true;
      const userMatches = targetUserId ? n.userId === targetUserId : true;
      if (roleMatches && userMatches) {
        return { ...n, isRead: true };
      }
      return n;
    });

    storageService.setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
    return true;
  },

  async createNotification({
    userId = null,
    role = 'institution',
    title,
    message,
    category = 'general',
  }) {
    const list = storageService.getItem(STORAGE_KEYS.NOTIFICATIONS, []);
    const safeList = Array.isArray(list) ? list : [];

    const newNotif = {
      id: `notif-${crypto.randomUUID().slice(0, 8)}`,
      userId,
      role,
      title,
      message,
      category,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newNotif, ...safeList].slice(0, 100);
    storageService.setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
    return newNotif;
  },
};
