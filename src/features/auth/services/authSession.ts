import { ApiError } from '@/config/apiClient';
import { authRequest, SYSTEM_CODE, toAuthTokens, type TokenResponse } from '@/features/auth/services/authApi';
import type { AuthTokens, SessionMode, SessionTenant, StoredAuth } from '@/features/auth/types/auth.types';

/**
 * Where the atm-auth-api tokens live in the browser.
 *
 * - The access token lives only in memory: it lasts minutes and the refresh token brings it back after a reload.
 * - The refresh token keeps the session. Where it is stored depends on what atm-auth-api decides for this system:
 *   `persistent` -> localStorage (survives closing the browser); `temporary` -> sessionStorage (one tab).
 */
const AUTH_KEY = 'pulso:auth';
const REFRESH_LOCK = 'pulso-auth-refresh';
/** It renews a little before the token expires, not after a request failed. */
const REFRESH_MARGIN_MS = 30_000;

let access: { token: string; expiresAt: number } | null = null;
let inflight: Promise<string> | null = null;

function storageFor(mode: SessionMode): Storage | null {
  try {
    return mode === 'persistent' ? window.localStorage : window.sessionStorage;
  } catch {
    // Blocked storage (strict private mode): the session lives in memory.
    return null;
  }
}

function readStored(): StoredAuth | null {
  for (const mode of ['temporary', 'persistent'] as const) {
    try {
      const raw = storageFor(mode)?.getItem(AUTH_KEY);
      const parsed = raw ? (JSON.parse(raw) as Partial<StoredAuth>) : null;
      if (parsed?.refreshToken && parsed.sessionMode === mode) return { refreshToken: parsed.refreshToken, sessionMode: mode };
    } catch {
      // A damaged value counts as no session.
    }
  }
  return null;
}

function removeStored(): void {
  for (const mode of ['temporary', 'persistent'] as const) {
    try {
      storageFor(mode)?.removeItem(AUTH_KEY);
    } catch {
      // Nothing to remove.
    }
  }
}

function writeStored(stored: StoredAuth): void {
  // One copy only: if the mode changed, the other storage's copy goes.
  removeStored();
  try {
    storageFor(stored.sessionMode)?.setItem(AUTH_KEY, JSON.stringify(stored));
  } catch {
    // Without storage the session lasts as long as the tab.
  }
}

function setTokens(tokens: AuthTokens, now = Date.now()): void {
  access = { token: tokens.accessToken, expiresAt: now + tokens.expiresIn * 1000 };
  writeStored({ refreshToken: tokens.refreshToken, sessionMode: tokens.sessionMode });
}

function expired(): ApiError {
  return new ApiError(401, 'UNAUTHORIZED', 'Tu sesión expiró. Vuelve a iniciar sesión.');
}

/** Forgets this browser's session. It does not tell the server: `logout` does. */
export function clearTokens(): void {
  access = null;
  removeStored();
}

/** True when there is something to recover the session with: a live access token or a stored refresh token. */
export function hasStoredSession(): boolean {
  return access !== null || readStored() !== null;
}

/** Signs in with DNI and password. Throws `ApiError` (`PASSWORD_CHANGE_REQUIRED` when the first password must be replaced). */
export async function signIn(dni: string, password: string): Promise<void> {
  const response = await authRequest<TokenResponse>('/v1/login', { dni, password, system: SYSTEM_CODE });
  setTokens(toAuthTokens(response));
}

/** Ends the session on the server (best effort) and in this browser. */
export async function signOut(): Promise<void> {
  const stored = readStored();
  clearTokens();
  if (!stored) return;
  try {
    await authRequest('/v1/logout', { refresh_token: stored.refreshToken });
  } catch {
    // The browser is already signed out; an unreachable server cannot undo that.
  }
}

/** Changes the password. atm-auth-api ends every session of the person, so this browser's goes too. */
export async function changePassword(dni: string, currentPassword: string, newPassword: string): Promise<void> {
  await authRequest('/v1/password/change', { dni, current_password: currentPassword, new_password: newPassword });
  clearTokens();
}

function isFresh(now: number): boolean {
  return access !== null && access.expiresAt - REFRESH_MARGIN_MS > now;
}

/**
 * A valid access token, renewed if needed. `null` when nobody is signed in.
 * Throws `ApiError` 401 when the refresh token no longer works (the session is closed) and the network error
 * when it could not ask: a dropped connection is not an expired session.
 */
export async function getAccessToken(now = Date.now()): Promise<string | null> {
  if (isFresh(now) && access) return access.token;
  if (!readStored()) return access?.token ?? null;
  return refresh();
}

/** Asks for a new access token whatever the current one says: pulso-api rejected it. */
export function forceRefresh(): Promise<string> {
  access = null;
  return refresh();
}

function refresh(): Promise<string> {
  // The requests of one screen share a single renewal.
  inflight ??= withLock(renew).finally(() => {
    inflight = null;
  });
  return inflight;
}

/**
 * atm-auth-api rotates the refresh token on every use and closes the whole session if it sees a used one.
 * Two tabs renewing at once would break it: the lock queues them, and the second reads the token the first left.
 */
async function withLock<T>(task: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) return navigator.locks.request(REFRESH_LOCK, task);
  return task();
}

async function renew(): Promise<string> {
  const stored = readStored();
  if (!stored) throw expired();
  let tokens: AuthTokens;
  try {
    tokens = toAuthTokens(await authRequest<TokenResponse>('/v1/refresh', { refresh_token: stored.refreshToken }));
  } catch (error) {
    // Only a rejection from the server closes the session; a dropped network does not.
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      clearTokens();
      throw expired();
    }
    throw error;
  }
  setTokens(tokens);
  return tokens.accessToken;
}

interface TenantsResponse {
  items: { tenant_id: string; ruc: string; name: string; role: string; current: boolean }[];
}

/** The gyms (companies) the signed-in person works for in Pulso. The current one is marked. */
export async function listTenants(): Promise<SessionTenant[]> {
  const token = await getAccessToken();
  if (!token) throw expired();
  const response = await authRequest<TenantsResponse>('/v1/session/tenants', undefined, token);
  return response.items.map((item) => ({ tenantId: item.tenant_id, ruc: item.ruc, name: item.name, role: item.role, current: item.current }));
}

/**
 * Moves the session to another gym of the person, without asking for the password. atm-auth-api swaps the refresh
 * token for one of that company; a rejection (it is not theirs) leaves the session as it was.
 */
export function switchTenant(tenantId: string): Promise<void> {
  return withLock(async () => {
    const stored = readStored();
    if (!stored) throw expired();
    let tokens: AuthTokens;
    try {
      tokens = toAuthTokens(await authRequest<TokenResponse>('/v1/refresh', { refresh_token: stored.refreshToken, tenant_id: tenantId }));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearTokens();
        throw expired();
      }
      throw error;
    }
    setTokens(tokens);
  });
}
