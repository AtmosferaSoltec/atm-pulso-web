import { createContext, useContext } from 'react';
import type { SessionTenant } from '@/features/auth/types/auth.types';
import type { SessionUser } from '@/types/api.types';

export interface AuthContextValue {
  user: SessionUser | null;
  /** The gyms the person can work for; the selector shows when there is more than one. */
  tenants: SessionTenant[];
  /** Said on the login after the session ended on its own terms (a password change). */
  notice: string;
  /** True while a stored session is being recovered after a reload. */
  restoring: boolean;
  /** Signs in with atm-auth-api and loads the profile. Throws `ApiError`; `PASSWORD_CHANGE_REQUIRED` means the first password must be replaced. */
  login: (documentNumber: string, password: string) => Promise<SessionUser>;
  /** Moves the session to another gym and reloads the profile. Throws `ApiError`. */
  switchGym: (tenantId: string) => Promise<void>;
  logout: () => void;
  replaceUser: (user: SessionUser) => void;
  /** Leaves the session (atm-auth-api already ended it) and shows `message` on the login. */
  endSession: (message: string) => void;
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
