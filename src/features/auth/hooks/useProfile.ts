import { useDemoStore } from '@/store/demoStore';
import { DEMO_PASSWORD } from '@/features/auth/services/authData';
import type { DemoUser } from '@/features/auth/types/auth.types';

export const MIN_PASSWORD_LENGTH = 8;

interface ProfileApi {
  /** Saves the non-sensitive data. Returns an error message, or null when it worked. */
  updateProfile: (changes: { name: string; phone: string }) => string | null;
  /** Changes the password after checking the current one. Returns an error message, or null. */
  changePassword: (current: string, next: string, confirm: string) => string | null;
}

/** Self-service profile actions for the signed-in user. */
export function useProfile(): ProfileApi {
  const { setState, currentUser, setCurrentUser } = useDemoStore();

  function save(updated: DemoUser): void {
    setState((current) => ({ ...current, users: current.users.map((user) => (user.id === updated.id ? updated : user)) }));
    setCurrentUser(updated);
  }

  function updateProfile({ name, phone }: { name: string; phone: string }): string | null {
    if (!currentUser) return 'Tu sesión ya no está disponible.';
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    if (cleanName.length < 3) return 'Ingresa un nombre válido.';
    if (cleanPhone && !/^9\d{8}$/.test(cleanPhone)) return 'El celular debe tener 9 dígitos y empezar con 9.';
    save({ ...currentUser, name: cleanName, phone: cleanPhone || undefined });
    return null;
  }

  function changePassword(current: string, next: string, confirm: string): string | null {
    if (!currentUser) return 'Tu sesión ya no está disponible.';
    if (current !== (currentUser.password ?? DEMO_PASSWORD)) return 'La contraseña actual no es correcta.';
    if (next.length < MIN_PASSWORD_LENGTH) return `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    if (next === current) return 'La nueva contraseña debe ser distinta de la actual.';
    if (next !== confirm) return 'Las contraseñas nuevas no coinciden.';
    save({ ...currentUser, password: next });
    return null;
  }

  return { updateProfile, changePassword };
}
