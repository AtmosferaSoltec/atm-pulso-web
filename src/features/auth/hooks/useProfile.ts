import { api } from '@/config/apiClient';
import { describeError } from '@/config/errorMessages';
import { useAuth } from '@/store/authStore';
import { changePassword as changeAuthPassword } from '@/features/auth/services/authSession';
import type { SessionUser } from '@/types/api.types';

export const MIN_PASSWORD_LENGTH = 8;

/** The rule for a new password, shared by the profile and the first-login screen. Returns a message, or null when it is fine. */
export function validateNewPassword(current: string, next: string, confirm: string): string | null {
  if (next.length < MIN_PASSWORD_LENGTH) return `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  if (next === current) return 'La nueva contraseña debe ser distinta de la actual.';
  if (next !== confirm) return 'Las contraseñas nuevas no coinciden.';
  return null;
}

interface ProfileApi {
  /** Saves the non-sensitive data. Returns an error message, or null when it worked. */
  updateProfile: (changes: { name: string; phone: string }) => Promise<string | null>;
  /** Changes the password at atm-auth-api and signs out. Returns an error message, or null. */
  changePassword: (current: string, next: string, confirm: string) => Promise<string | null>;
}

/** Self-service profile actions for the signed-in user. */
export function useProfile(): ProfileApi {
  const { user, replaceUser, endSession } = useAuth();

  async function updateProfile({ name, phone }: { name: string; phone: string }): Promise<string | null> {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    if (cleanName.length < 3) return 'Ingresa un nombre válido.';
    if (cleanPhone && !/^9\d{8}$/.test(cleanPhone)) return 'El celular debe tener 9 dígitos y empezar con 9.';
    try {
      replaceUser(await api.patch<SessionUser>('/me', { full_name: cleanName, phone: cleanPhone }));
      return null;
    } catch (error) {
      return describeError(error);
    }
  }

  async function changePassword(current: string, next: string, confirm: string): Promise<string | null> {
    const invalid = validateNewPassword(current, next, confirm);
    if (invalid) return invalid;
    if (!user) return 'Inicia sesión de nuevo.';
    try {
      // atm-auth-api ends every session of the person: the login asks for the new password.
      await changeAuthPassword(user.document_number, current, next);
      endSession('Contraseña actualizada. Inicia sesión con tu nueva contraseña.');
      return null;
    } catch (error) {
      return describeError(error);
    }
  }

  return { updateProfile, changePassword };
}
