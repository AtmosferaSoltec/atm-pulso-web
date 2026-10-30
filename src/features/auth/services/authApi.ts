import { ApiError, AUTH_BASE_URL } from '@/config/apiClient';
import type { AuthTokens, SessionMode } from '@/features/auth/types/auth.types';

/** An atm-auth-api error: `{ "error": { "code", "message" } }`. */
interface AuthErrorBody {
  error?: { code?: string; message?: string };
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  session_mode: SessionMode;
}

/** The pulso code of the system in atm-auth-api. */
export const SYSTEM_CODE = 'pulso';

/** atm-auth-api codes the interface treats on their own. */
export const PASSWORD_CHANGE_REQUIRED = 'PASSWORD_CHANGE_REQUIRED';

/** What atm-auth-api answered, as the `ApiError` the rest of the app already understands. */
function translate(status: number, authCode: string | undefined, retryAfterSeconds: number, onPasswordChange: boolean): ApiError {
  switch (authCode) {
    case 'invalid_credentials':
      // The same text for an unknown DNI and a wrong password: nobody learns which DNIs exist.
      return new ApiError(401, onPasswordChange ? 'CURRENT_PASSWORD_INCORRECT' : 'INVALID_CREDENTIALS', 'DNI o contraseña incorrectos.');
    case 'no_access':
      return new ApiError(403, 'NO_ACCESS', 'Tu cuenta no tiene acceso a Pulso. Contacta a Atmósfera.');
    case 'password_change_required':
      return new ApiError(403, PASSWORD_CHANGE_REQUIRED, 'Debes crear una nueva contraseña para continuar.');
    case 'weak_password':
      return new ApiError(400, 'WEAK_PASSWORD', 'La nueva contraseña debe ser distinta de la actual y de tu DNI, y tener al menos 8 caracteres.');
    case 'too_many_attempts': {
      const minutes = Math.max(1, Math.ceil((retryAfterSeconds || 60) / 60));
      return new ApiError(429, 'TOO_MANY_ATTEMPTS', `Demasiados intentos. Espera ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} e inténtalo de nuevo.`);
    }
    default:
      if (status === 401) return new ApiError(401, 'UNAUTHORIZED', 'Tu sesión expiró. Vuelve a iniciar sesión.');
      return new ApiError(status, authCode?.toUpperCase() ?? 'UNKNOWN', 'No pudimos verificar tu cuenta en este momento. Inténtalo de nuevo en un instante.');
  }
}

/** A call to atm-auth-api (POST with a JSON body, or GET when `body` is undefined). Resolves with the body, or throws `ApiError`. */
export async function authRequest<T>(path: string, body?: unknown, token?: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${AUTH_BASE_URL}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor.');
  }
  if (response.ok) {
    if (response.status === 204) return undefined as T;
    return (await response.json().catch(() => undefined)) as T;
  }
  const payload = (await response.json().catch(() => null)) as AuthErrorBody | null;
  throw translate(response.status, payload?.error?.code, Number(response.headers.get('Retry-After')), path === '/v1/password/change');
}

export function toAuthTokens(response: TokenResponse): AuthTokens {
  return { accessToken: response.access_token, refreshToken: response.refresh_token, expiresIn: response.expires_in, sessionMode: response.session_mode };
}
