/**
 * The state of the kiosk screen, as pure functions (no React, no browser): what is typed, what is asked and
 * what is shown. The decision to let someone in is always the server's; this only turns its answer into
 * large, plain Spanish for people looking at a tablet at the door.
 *
 * Imports nothing from the app so the unit tests can run it directly with Node.
 */

/** A DNI has 8 digits; a carné de extranjería up to 12. */
export const MIN_DOCUMENT_DIGITS = 8;
export const MAX_DOCUMENT_DIGITS = 12;
/** How long an answer (allowed, denied or error) stays on screen before the keypad comes back. */
export const RESULT_RESET_MS = 5000;
/** A half-typed document is cleared after this long without touches: the next person must not see it. */
export const IDLE_CLEAR_MS = 20_000;
/** Days left at or below which an allowed answer also warns that the membership ends soon. */
export const EXPIRING_SOON_DAYS = 7;

export interface KioskOutcome {
  allowed: boolean;
  /** Only the first name of the member, or null when the document is not registered. */
  firstName: string | null;
  headline: string;
  detail: string;
  /** Allowed only: the membership ends within `EXPIRING_SOON_DAYS`. */
  endingSoon: boolean;
}

export type KioskFailureKind = 'offline' | 'rate_limited' | 'session' | 'disabled' | 'branch' | 'invalid' | 'server';

export interface KioskFailure {
  kind: KioskFailureKind;
  headline: string;
  detail: string;
}

export type KioskState =
  | { phase: 'entering'; digits: string }
  | { phase: 'checking'; digits: string }
  | { phase: 'result'; outcome: KioskOutcome }
  | { phase: 'error'; failure: KioskFailure };

export type KioskAction =
  | { type: 'digit'; value: string }
  | { type: 'backspace' }
  | { type: 'clear' }
  | { type: 'submit' }
  | { type: 'answered'; outcome: KioskOutcome }
  | { type: 'failed'; failure: KioskFailure }
  | { type: 'reset' };

export const initialKioskState: KioskState = { phase: 'entering', digits: '' };

/** Whether the typed digits are enough to ask. */
export function canSubmit(state: KioskState): boolean {
  return state.phase === 'entering' && state.digits.length >= MIN_DOCUMENT_DIGITS;
}

/**
 * `submit` only moves `entering` to `checking`, once: a second tap while checking (or showing an answer) changes
 * nothing, which is what stops a double send. Answers only land while checking.
 */
export function kioskReducer(state: KioskState, action: KioskAction): KioskState {
  switch (action.type) {
    case 'digit':
      if (state.phase !== 'entering' || !/^\d$/.test(action.value) || state.digits.length >= MAX_DOCUMENT_DIGITS) return state;
      return { phase: 'entering', digits: state.digits + action.value };
    case 'backspace':
      return state.phase === 'entering' && state.digits ? { phase: 'entering', digits: state.digits.slice(0, -1) } : state;
    case 'clear':
      return state.phase === 'entering' && state.digits ? initialKioskState : state;
    case 'submit':
      return canSubmit(state) && state.phase === 'entering' ? { phase: 'checking', digits: state.digits } : state;
    case 'answered':
      return state.phase === 'checking' ? { phase: 'result', outcome: action.outcome } : state;
    case 'failed':
      return state.phase === 'checking' ? { phase: 'error', failure: action.failure } : state;
    case 'reset':
      return initialKioskState;
  }
}

/** How long until the screen goes back to the keypad on its own; null when it waits for the person. */
export function resetDelay(state: KioskState): number | null {
  if (state.phase === 'result' || state.phase === 'error') return RESULT_RESET_MS;
  if (state.phase === 'entering' && state.digits) return IDLE_CLEAR_MS;
  return null;
}

/**
 * The typed document for the screen: every digit hidden except the last one, so the person sees they are
 * typing without the whole number being readable by whoever is behind them.
 */
export function maskDocument(digits: string): string {
  if (!digits) return '';
  return '•'.repeat(digits.length - 1) + digits.slice(-1);
}

/** The PIN field never shows a digit. */
export function maskPin(length: number): string {
  return '•'.repeat(length);
}

/** "JUAN CARLOS PÉREZ" or "andrea garcía" become "Juan" and "Andrea". */
export function firstNameOf(fullName: string | null | undefined): string | null {
  const first = (fullName ?? '').trim().split(/\s+/)[0];
  if (!first) return null;
  return first.charAt(0).toLocaleUpperCase('es-PE') + first.slice(1).toLocaleLowerCase('es-PE');
}

/** Whole days from `from` to `to`, both `YYYY-MM-DD`; 0 when they are the same day. */
export function daysBetween(from: string, to: string): number {
  const at = (date: string): number => {
    const [year, month, day] = date.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((at(to) - at(from)) / 86_400_000);
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** The answer of `POST /access/checks`, reduced to what the screen may show. `today` is the Lima date. */
export interface CheckAnswer {
  allowed: boolean;
  reason: string;
  ends_on: string | null;
  member: { full_name: string } | null;
}

export function outcomeFromCheck(check: CheckAnswer, today: string): KioskOutcome {
  const firstName = firstNameOf(check.member?.full_name);
  if (check.allowed) {
    const left = check.ends_on ? Math.max(0, daysBetween(today, check.ends_on)) : null;
    let detail = 'Que tengas un buen entrenamiento';
    if (left === 0) detail = 'Hoy es el último día de tu membresía';
    else if (left === 1) detail = 'Te queda 1 día de membresía';
    else if (left !== null) detail = `Te quedan ${left} días de membresía`;
    return { allowed: true, firstName, headline: firstName ? `¡Hola, ${firstName}!` : '¡Bienvenido!', detail, endingSoon: left !== null && left <= EXPIRING_SOON_DAYS };
  }
  const base = { allowed: false, firstName, endingSoon: false };
  switch (check.reason) {
    case 'NOT_REGISTERED':
      return { ...base, headline: 'Documento no registrado', detail: 'Consulta en recepción' };
    case 'MEMBERSHIP_EXPIRED':
      return { ...base, headline: 'Membresía vencida', detail: firstName ? `${firstName}, renueva en recepción` : 'Renueva en recepción' };
    case 'MEMBERSHIP_NOT_STARTED': {
      const wait = check.ends_on ? daysBetween(today, check.ends_on) : null;
      let detail = 'Tu membresía todavía no empieza';
      if (wait === 1) detail = 'Tu membresía empieza mañana';
      else if (wait !== null && wait > 1) detail = `Tu membresía empieza en ${plural(wait, 'día', 'días')}`;
      return { ...base, headline: 'Aún no empieza', detail };
    }
    case 'BRANCH_NOT_ALLOWED':
      return { ...base, headline: 'Sede no permitida', detail: 'Tu membresía no incluye esta sede' };
    default:
      return { ...base, headline: 'No se pudo verificar', detail: 'Consulta en recepción' };
  }
}

/** What went wrong with the request, reduced to the facts the screen needs (an `ApiError`'s status and code). */
export interface RequestFailure {
  status: number;
  code: string;
}

export function failureFromRequest({ status, code }: RequestFailure): KioskFailure {
  if (status === 0 || code === 'NETWORK_ERROR') {
    return { kind: 'offline', headline: 'Sin conexión', detail: 'No se pudo verificar. Avisa en recepción.' };
  }
  if (status === 429) return { kind: 'rate_limited', headline: 'Demasiados intentos', detail: 'Espera unos segundos e inténtalo de nuevo.' };
  if (status === 401) return { kind: 'session', headline: 'Quiosco desconectado', detail: 'Avisa en recepción.' };
  if (code === 'FEATURE_DISABLED') return { kind: 'disabled', headline: 'Quiosco no disponible', detail: 'Avisa en recepción.' };
  if (code === 'BRANCH_NOT_ACCESSIBLE') return { kind: 'branch', headline: 'Sede no disponible', detail: 'Avisa en recepción.' };
  if (status === 400) return { kind: 'invalid', headline: 'Documento no válido', detail: 'Revisa el número e inténtalo de nuevo.' };
  return { kind: 'server', headline: 'No se pudo verificar', detail: 'Inténtalo de nuevo o avisa en recepción.' };
}

/** The message of the exit-PIN dialog for a failed attempt. */
export function pinFailureText({ status, code }: RequestFailure): string {
  if (status === 0) return 'Sin conexión. Inténtalo de nuevo.';
  if (code === 'KIOSK_PIN_INVALID') return 'PIN incorrecto.';
  if (code === 'KIOSK_PIN_LOCKED' || status === 429) return 'Demasiados intentos. Espera unos minutos.';
  if (code === 'KIOSK_PIN_NOT_SET') return 'Aún no hay un PIN de salida. Pide al administrador que lo defina.';
  return 'No se pudo comprobar el PIN.';
}
