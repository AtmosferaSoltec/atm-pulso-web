import { createContext, useContext } from 'react';
import type { Session, SessionUser } from '@/types/api.types';

export interface AuthContextValue {
  user: SessionUser | null;
  /** Client the superadmin is looking at; null when not inspecting. */
  inspectedId: string | null;
  /** Set after a forced password change, so the login can say it worked. */
  notice: string;
  login: (documentNumber: string, password: string) => Promise<SessionUser>;
  logout: () => void;
  inspect: (organizationId: string | null) => void;
  replaceUser: (user: SessionUser) => void;
  /** Used after a password change: stores the fresh token, or signs out when the API asks to log in again. */
  applyPasswordChange: (result: Session | { login_required: true }) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider is required');
  return context;
}

/** The signed-in user, for screens that only render after sign-in. */
export function useCurrentUser(): SessionUser {
  const { user } = useAuth();
  if (!user) throw new Error('A signed-in user is required');
  return user;
}
