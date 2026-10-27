import type { AccessCheck, AccessEvent } from '@/types/api.types';
import { formatDate } from '@/utils/formatDate';

/** Spanish text for the reason codes the API answers. The decision itself is always the server's. */
export function reasonText(reason: string, endsOn?: string | null, expiringInDays?: number | null): string {
  switch (reason) {
    case 'MEMBERSHIP_VALID': {
      const until = `Membresía vigente hasta el ${endsOn ? formatDate(endsOn) : '—'}.`;
      if (expiringInDays === undefined || expiringInDays === null) return until;
      if (expiringInDays === 0) return `${until} Vence hoy.`;
      return `${until} Vence en ${expiringInDays} ${expiringInDays === 1 ? 'día' : 'días'}.`;
    }
    case 'MEMBERSHIP_EXPIRED':
      return endsOn ? `La membresía venció el ${formatDate(endsOn)}.` : 'La membresía venció.';
    case 'MEMBERSHIP_NOT_STARTED':
      return endsOn ? `La membresía todavía no está vigente. Inicia el ${formatDate(endsOn)}.` : 'La membresía todavía no está vigente.';
    case 'BRANCH_NOT_ALLOWED':
      return 'La membresía no permite ingresar a esta sede.';
    case 'NOT_REGISTERED':
      return 'Documento no registrado en esta cuenta.';
    case 'DAY_PASS':
      return 'Pase del día';
    default:
      return 'No se pudo verificar el ingreso.';
  }
}

export function checkText(check: AccessCheck): string {
  return reasonText(check.reason, check.ends_on, check.expiring_in_days);
}

export function eventText(event: AccessEvent): string {
  return reasonText(event.reason);
}

/** "14:03" in Lima time. */
export function timeInLima(iso: string): string {
  return new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' }).format(new Date(iso));
}
