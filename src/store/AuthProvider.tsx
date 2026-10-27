import { useCallback, useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, setAuthToken, setInspectedOrganization, setUnauthorizedHandler } from '@/config/apiClient';
import { AuthContext, type AuthContextValue } from '@/store/authStore';
import type { Session, SessionUser } from '@/types/api.types';

/** The session lives in memory only: a reload means signing in again (nothing sensitive in storage). */
export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const clear = useCallback(
    (message = '') => {
      setAuthToken(null);
      setInspectedOrganization(null);
      setUser(null);
      setInspectedId(null);
      setNotice(message);
      queryClient.clear();
    },
    [queryClient],
  );

  useEffect(() => {
    setUnauthorizedHandler(() => clear('Tu sesión terminó. Inicia sesión de nuevo.'));
    return () => setUnauthorizedHandler(null);
  }, [clear]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      inspectedId,
      notice,
      async login(documentNumber, password) {
        const session = await api.post<Session>('/auth/login', { document_number: documentNumber, password });
        setAuthToken(session.access_token);
        queryClient.clear();
        setNotice('');
        setUser(session.user);
        return session.user;
      },
      logout: () => clear(),
      inspect(organizationId) {
        setInspectedOrganization(organizationId);
        setInspectedId(organizationId);
        queryClient.clear();
      },
      replaceUser: setUser,
      applyPasswordChange(result) {
        if ('login_required' in result) {
          clear('Contraseña actualizada. Inicia sesión con tu nueva contraseña.');
          return;
        }
        setAuthToken(result.access_token);
        setUser(result.user);
      },
    }),
    [user, inspectedId, notice, clear, queryClient],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
