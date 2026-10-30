import type { Role } from '@/types/api.types';

/**
 * admin         Manages everything of the account: every gym and branch, its team, prices and identity.
 * receptionist  Works the branches assigned to them.
 */
export type UserRole = Role;

/** How atm-auth-api treats the sessions of this system. */
export type SessionMode = 'persistent' | 'temporary';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Seconds the access token lasts. */
  expiresIn: number;
  sessionMode: SessionMode;
}

export interface StoredAuth {
  refreshToken: string;
  sessionMode: SessionMode;
}

/** A gym (company) the person can work for, as atm-auth-api lists it. */
export interface SessionTenant {
  tenantId: string;
  ruc: string;
  name: string;
  role: string;
  current: boolean;
}
