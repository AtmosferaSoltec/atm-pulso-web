import { useCallback, useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, setAuthToken, setInspectedOrganization, setUnauthorizedHandler } from '@/config/apiClient';
import { AuthContext, type AuthContextValue } from '@/store/authStore';
import type { Session, SessionUser } from '@/types/api.types';

const STORAGE_KEY = 'pulso.session';

interface StoredSession {
  token: string;
  inspectedId: string | null;
}

/** sessionStorage dies with the tab: a reload keeps the session, closing the tab asks for the login again. */
function readStored(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function writeStored(session: StoredSession | null): void {
  try {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode): the session just lives until the next reload.
  }
}

/** Keeps the session in memory and in sessionStorage; on load it restores the user from GET /me. */
export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [restoring, setRestoring] = useState(() => readStored() !== null);

  const clear = useCallback(
    (message = '') => {
      writeStored(null);
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
    const stored = readStored();
    if (!stored) return;
    setAuthToken(stored.token);
    setInspectedOrganization(stored.inspectedId);
    let active = true;
    api
      .get<SessionUser>('/me')
      .then((restored) => {
        if (!active) return;
        setUser(restored);
        setInspectedId(stored.inspectedId);
      })
      .catch(() => {
        if (!active) return;
        writeStored(null);
        setAuthToken(null);
        setInspectedOrganization(null);
      })
      .finally(() => {
        if (active) setRestoring(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => clear('Tu sesión terminó. Inicia sesión de nuevo.'));
    return () => setUnauthorizedHandler(null);
  }, [clear]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      inspectedId,
      notice,
      restoring,
      async login(documentNumber, password) {
        const session = await api.post<Session>('/auth/login', { document_number: documentNumber, password });
        setAuthToken(session.access_token);
        writeStored({ token: session.access_token, inspectedId: null });
        queryClient.clear();
        setNotice('');
        setUser(session.user);
        return session.user;
      },
      logout: () => clear(),
      inspect(organizationId) {
        setInspectedOrganization(organizationId);
        setInspectedId(organizationId);
        const stored = readStored();
        if (stored) writeStored({ ...stored, inspectedId: organizationId });
        queryClient.clear();
      },
      replaceUser: setUser,
      applyPasswordChange(result) {
        if ('login_required' in result) {
          clear('Contraseña actualizada. Inicia sesión con tu nueva contraseña.');
          return;
        }
        setAuthToken(result.access_token);
        writeStored({ token: result.access_token, inspectedId });
        setUser(result.user);
      },
    }),
    [user, inspectedId, notice, restoring, clear, queryClient],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
