/**
 * NidhiSetu Auth Repository
 * Simulates authentication logic, credential validation, and session lifecycle.
 * Disclaimer: Client-side prototype simulation; real security must be backed by a server.
 */

import { userRepository } from './userRepository';
import { institutionRepository } from './institutionRepository';
import { sessionRepository } from './sessionRepository';
import { auditRepository } from './auditRepository';

export const authRepository = {
  async login(email, accessCode, role = null) {
    const cleanEmail = email?.trim().toLowerCase();
    const user = await userRepository.getUserByEmail(cleanEmail);
    const resolvedRole = role || user?.role || 'institution';
    const result = await this.authenticate({
      email,
      accessCode,
      role: resolvedRole,
    });
    return { success: true, ...result };
  },

  async authenticate({ email, accessCode, role, rememberMe = false }) {
    if (!email || !accessCode) {
      throw new Error('Please enter both official email and demo access code.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await userRepository.getUserByEmail(cleanEmail);

    if (!user) {
      throw new Error(`No account found registered under email "${email}".`);
    }

    if (user.role !== role) {
      throw new Error(
        `Access denied: This account belongs to the "${user.role.toUpperCase()}" portal, not "${role.toUpperCase()}".`
      );
    }

    if (user.status !== 'active') {
      throw new Error('This account has been deactivated. Please contact the System Administrator.');
    }

    // Verify access code
    if (user.accessCode !== accessCode) {
      throw new Error('Invalid demo access code. Use the role credentials displayed below.');
    }

    // Fetch institution details if user is an institution representative
    let institution = null;
    if (user.institutionId) {
      institution = await institutionRepository.getInstitutionById(user.institutionId);
    }

    // Update last login
    await userRepository.updateUser(user.id, {
      lastLoginAt: new Date().toISOString(),
    });

    // Record audit event
    await auditRepository.logEvent({
      eventType: 'DEMO_LOGIN',
      actorId: user.id,
      actorRole: user.role,
      targetEntityId: institution ? institution.id : 'portal',
      summary: `Successful simulated login for ${user.name} (${user.role})`,
      metadata: { email: user.email, rememberMe },
    });

    // Save session
    const session = await sessionRepository.saveSession(user, institution, rememberMe);

    return { user, institution, session };
  },

  async logout(user = null) {
    if (user) {
      await auditRepository.logEvent({
        eventType: 'DEMO_LOGOUT',
        actorId: user.id,
        actorRole: user.role,
        targetEntityId: 'session',
        summary: `User ${user.name} logged out from the portal`,
      });
    }

    await sessionRepository.clearSession();
    return true;
  },

  async getCurrentSession() {
    const session = await sessionRepository.getSession();
    if (!session) return null;

    // Cross-verify that user still exists and is active
    const liveUser = await userRepository.getUserById(session.userId);
    if (!liveUser || liveUser.status !== 'active') {
      await sessionRepository.clearSession();
      return null;
    }

    let liveInstitution = null;
    if (liveUser.institutionId) {
      liveInstitution = await institutionRepository.getInstitutionById(liveUser.institutionId);
    }

    return {
      session,
      user: liveUser,
      institution: liveInstitution,
    };
  },
};
