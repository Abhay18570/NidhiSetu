import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './authContextDef';
import {
  initializeStorage,
  authRepository,
  userRepository,
  institutionRepository,
  auditRepository,
} from '../storage';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [currentInstitution, setCurrentInstitution] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize storage and load session on mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        initializeStorage(false);
        const active = await authRepository.getCurrentSession();
        if (isMounted) {
          if (active) {
            setCurrentUser(active.user);
            setCurrentRole(active.user.role);
            setCurrentInstitution(active.institution);
            setSession(active.session);
          } else {
            setCurrentUser(null);
            setCurrentRole(null);
            setCurrentInstitution(null);
            setSession(null);
          }
        }
      } catch (err) {
        console.error('[NidhiSetu Auth] Failed to restore session:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async ({ email, accessCode, role, rememberMe = false }) => {
    setIsLoading(true);
    try {
      const result = await authRepository.authenticate({
        email,
        accessCode,
        role,
        rememberMe,
      });

      setCurrentUser(result.user);
      setCurrentRole(result.user.role);
      setCurrentInstitution(result.institution);
      setSession(result.session);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authRepository.logout(currentUser);
      setCurrentUser(null);
      setCurrentRole(null);
      setCurrentInstitution(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const refreshUser = useCallback(async () => {
    if (!currentUser) return;
    const fresh = await userRepository.getUserById(currentUser.id);
    if (fresh) {
      setCurrentUser(fresh);
      setCurrentRole(fresh.role);
      if (fresh.institutionId) {
        const freshInst = await institutionRepository.getInstitutionById(fresh.institutionId);
        setCurrentInstitution(freshInst);
      }
    }
  }, [currentUser]);

  const updateUserProfile = useCallback(
    async (updates) => {
      if (!currentUser) throw new Error('Not authenticated');
      const updatedUser = await userRepository.updateUser(currentUser.id, updates);
      setCurrentUser(updatedUser);

      await auditRepository.logEvent({
        eventType: 'PROFILE_UPDATED',
        actorId: currentUser.id,
        actorRole: currentUser.role,
        targetEntityId: currentUser.id,
        summary: `User profile updated for ${updatedUser.name}`,
      });

      return updatedUser;
    },
    [currentUser]
  );

  const updateInstitutionProfile = useCallback(
    async (updates) => {
      if (!currentInstitution) throw new Error('No linked institution found');
      const updatedInst = await institutionRepository.updateInstitution(
        currentInstitution.id,
        updates
      );
      setCurrentInstitution(updatedInst);

      await auditRepository.logEvent({
        eventType: 'INSTITUTION_PROFILE_UPDATED',
        actorId: currentUser?.id || 'unknown',
        actorRole: currentUser?.role || 'institution',
        targetEntityId: updatedInst.id,
        summary: `Institution profile updated for ${updatedInst.name} (${updatedInst.aisheCode})`,
      });

      return updatedInst;
    },
    [currentInstitution, currentUser]
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        currentInstitution,
        session,
        isAuthenticated: Boolean(currentUser),
        isLoading,
        login,
        logout,
        refreshUser,
        updateUserProfile,
        updateInstitutionProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
