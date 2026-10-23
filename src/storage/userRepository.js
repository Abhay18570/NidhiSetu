/**
 * NidhiSetu User Repository
 * Manages prototype users with role guards and admin preservation.
 */

import { storageService, STORAGE_KEYS } from './storageService';

export const userRepository = {
  async getAllUsers() {
    const users = storageService.getItem(STORAGE_KEYS.USERS, []);
    return Array.isArray(users) ? users : [];
  },

  async getUserById(id) {
    const users = await this.getAllUsers();
    return users.find((u) => u.id === id) || null;
  },

  async getUserByEmail(email) {
    if (!email) return null;
    const users = await this.getAllUsers();
    return users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
  },

  async createUser(userData) {
    const users = await this.getAllUsers();
    const existing = users.find((u) => u.email.toLowerCase() === userData.email.trim().toLowerCase());
    if (existing) {
      throw new Error(`A demo account with email "${userData.email}" already exists.`);
    }

    const newUser = {
      id: userData.id || `usr-${crypto.randomUUID().slice(0, 8)}`,
      name: userData.name,
      designation: userData.designation || 'Institutional Signatory',
      email: userData.email.trim().toLowerCase(),
      phone: userData.phone || '',
      role: userData.role || 'institution',
      accessCode: userData.accessCode || 'demo@123',
      institutionId: userData.institutionId || null,
      status: userData.status || 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    };

    const updated = [...users, newUser];
    storageService.setItem(STORAGE_KEYS.USERS, updated);
    return newUser;
  },

  async updateUser(id, updates) {
    const users = await this.getAllUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error(`User with ID "${id}" not found.`);
    }

    const existing = users[index];
    const updatedUser = {
      ...existing,
      ...updates,
      id: existing.id, // Never alter primary ID
      role: existing.role, // Preserve role
    };

    users[index] = updatedUser;
    storageService.setItem(STORAGE_KEYS.USERS, users);
    return updatedUser;
  },

  async updateUserStatus(id, newStatus) {
    const users = await this.getAllUsers();
    const target = users.find((u) => u.id === id);
    if (!target) {
      throw new Error('Target user account not found.');
    }

    // Safety rule: Prevent deactivation of the last active administrator
    if (target.role === 'admin' && newStatus !== 'active') {
      const activeAdmins = users.filter((u) => u.role === 'admin' && u.status === 'active');
      if (activeAdmins.length <= 1) {
        throw new Error('Safety restriction: Cannot deactivate the last remaining active Administrator.');
      }
    }

    return this.updateUser(id, { status: newStatus });
  },
};
