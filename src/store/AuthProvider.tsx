import { useCallback, useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, ApiError, setTokenSource, setUnauthorizedHandler } from '@/config/apiClient';
import { clearTokens, forceRefresh, getAccessToken, hasStoredSession, listTenants, signIn, signOut, switchTenant } from '@/features/auth/services/authSession';
import type { SessionTenant } from '@/features/auth/types/auth.types';
import { AuthContext, type AuthContextValue } from '@/store/authStore';
import type { SessionUser } from '@/types/api.types';

/**
 * Holds the signed-in user. The tokens are atm-auth-api's and live in `authSession`; on load, a stored
 * refresh token brings the session back and `GET /me` says who it is.
 */
export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [tenants, setTenants] = useState<SessionTenant[]>([]);
  const [notice, setNotice] = useState('');
  const [restoring, setRestoring] = useState(() => hasStoredSession());

  const clear = useCallback(
    (message = '') => {
      clearTokens();
      setUser(null);
      setTenants([]);
      setNotice(message);
      queryClient.clear();
    },
    [queryClient],
  );

  /** The gym selector only matters with more than one gym; a failure just hides it. */
  const loadTenants = useCallback(() => {
    listTenants()
      .then(setTenants)
      .catch(() => setTenants([]));
  }, []);

  useEffect(() => {
    setTokenSource({ getAccessToken, forceRefresh });
    return () => setTokenSource(null);
  }, []);

  useEffect(() => {
    if (!hasStoredSession()) return;
    let active = true;
    api
      .get<SessionUser>('/me')
      .then((restored) => {
        if (!active) return;
        setUser(restored);
        loadTenants();
      })
      .catch((error: unknown) => {
        // A dropped connection keeps the stored session for the next try; anything else asks to sign in again.
        if (active && !(error instanceof ApiError && error.status === 0)) clearTokens();
      })
      .finally(() => {
        if (active) setRestoring(false);
      });
    return () => {
      active = false;
    };
  }, [loadTenants]);

  useEffect(() => {
    setUnauthorizedHandler(() => clear('Tu sesión terminó. Inicia sesión de nuevo.'));
    return () => setUnauthorizedHandler(null);
  }, [clear]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      tenants,
      notice,
      restoring,
      async login(documentNumber, password) {
        await signIn(documentNumber, password);
        let profile: SessionUser;
        try {
          profile = await api.get<SessionUser>('/me');
        } catch (error) {
          // Signed in at atm-auth-api but not allowed in Pulso (no role here, inactive...): leave no session behind.
          await signOut();
          throw error;
        }
        queryClient.clear();
        setNotice('');
        setUser(profile);
        loadTenants();
        return profile;
      },
      async switchGym(tenantId) {
        await switchTenant(tenantId);
        // Everything cached belongs to the previous gym.
        queryClient.clear();
        const profile = await api.get<SessionUser>('/me');
        setUser(profile);
        loadTenants();
      },
      logout() {
        void signOut();
        clear();
      },
      replaceUser: setUser,
      endSession: (message) => clear(message),
    }),
    [user, tenants, notice, restoring, clear, queryClient, loadTenants],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
