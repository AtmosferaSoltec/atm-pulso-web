import { api } from '@/config/apiClient';
import { describeError } from '@/config/errorMessages';
import { useAuth } from '@/store/authStore';
import type { Session, SessionUser } from '@/types/api.types';

export const MIN_PASSWORD_LENGTH = 8;

interface ProfileApi {
  /** Saves the non-sensitive data. Returns an error message, or null when it worked. */
  updateProfile: (changes: { name: string; phone: string }) => Promise<string | null>;
  /** Changes the password after checking the current one. Returns an error message, or null. */
  changePassword: (current: string, next: string, confirm: string) => Promise<string | null>;
}

/** Self-service profile actions for the signed-in user. */
export function useProfile(): ProfileApi {
  const { replaceUser, applyPasswordChange } = useAuth();

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
    if (next.length < MIN_PASSWORD_LENGTH) return `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    if (next === current) return 'La nueva contraseña debe ser distinta de la actual.';
    if (next !== confirm) return 'Las contraseñas nuevas no coinciden.';
    try {
      applyPasswordChange(await api.post<Session | { login_required: true }>('/me/password', { current_password: current, new_password: next }));
      return null;
    } catch (error) {
      return describeError(error);
    }
  }

  return { updateProfile, changePassword };
}
