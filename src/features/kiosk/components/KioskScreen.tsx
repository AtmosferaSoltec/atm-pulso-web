import { useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore, type ReactElement } from 'react';
import { ApiError, api } from '@/config/apiClient';
import { Icon } from '@/components/ui/icon';
import { GymBrand } from '@/features/branding';
import { KioskExitDialog } from '@/features/kiosk/components/KioskExitDialog';
import { KioskKeypad } from '@/features/kiosk/components/KioskKeypad';
import { setSoundEnabled, soundEnabled } from '@/features/kiosk/services/kioskPreferences';
import { canGoFullscreen, enterFullscreen, exitFullscreen, feedback, isFullscreen, keepScreenOn } from '@/features/kiosk/services/kioskDevice';
import {
  canSubmit,
  failureFromRequest,
  initialKioskState,
  kioskReducer,
  maskDocument,
  outcomeFromCheck,
  resetDelay,
  RESULT_RESET_MS,
  MIN_DOCUMENT_DIGITS,
  type CheckAnswer,
} from '@/features/kiosk/services/kioskScreen';
import { todayInLima } from '@/utils/limaDate';
import '@/features/kiosk/kiosk.css';

/** Hold the logo this long to open the exit PIN. */
const EXIT_HOLD_MS = 3000;
/** Longer than this without an answer is treated as a lost connection, never as "allowed". */
const CHECK_TIMEOUT_MS = 12_000;

interface KioskScreenProps {
  gymName: string;
  logoUrl: string | null;
  branchId: string;
  branchName: string;
  /** The exit PIN was accepted. */
  onExit: () => void;
}

interface CheckResponse extends CheckAnswer {
  checked_at: string;
}

function subscribeOnline(callback: () => void): () => void {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

/** The tablet at the door: type the document, see the answer, back to the keypad in 5 seconds. */
export function KioskScreen({ gymName, logoUrl, branchId, branchName, onExit }: KioskScreenProps): ReactElement {
  const [state, dispatch] = useReducer(kioskReducer, initialKioskState);
  const [exiting, setExiting] = useState(false);
  const [sound, setSound] = useState(soundEnabled);
  const [fullscreen, setFullscreen] = useState(isFullscreen);
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const attempt = useRef(0);
  const sending = useRef(false);
  const soundRef = useRef(sound);
  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  // The screen stays on; the browser may take it away when hidden, the helper asks again.
  useEffect(() => keepScreenOn(), []);

  // No Back button into the app behind: stepping back stays on the kiosk.
  useEffect(() => {
    window.history.pushState({}, '', window.location.href);
    const trap = (): void => window.history.pushState({}, '', window.location.href);
    window.addEventListener('popstate', trap);
    return () => window.removeEventListener('popstate', trap);
  }, []);

  useEffect(() => {
    const onChange = (): void => setFullscreen(isFullscreen());
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Answers and half-typed documents clear themselves.
  useEffect(() => {
    const delay = resetDelay(state);
    if (delay === null) return;
    const timeout = window.setTimeout(() => dispatch({ type: 'reset' }), delay);
    return () => window.clearTimeout(timeout);
  }, [state]);

  // A new person may type again once the keypad is back.
  useEffect(() => {
    if (state.phase === 'entering') sending.current = false;
  }, [state.phase]);

  // A request that never answers is a lost connection.
  useEffect(() => {
    if (state.phase !== 'checking') return;
    const timeout = window.setTimeout(() => {
      attempt.current += 1;
      dispatch({ type: 'failed', failure: failureFromRequest({ status: 0, code: 'NETWORK_ERROR' }) });
    }, CHECK_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [state.phase]);

  // Discreet sound and vibration for the answer, when the tablet has it switched on.
  useEffect(() => {
    if (!soundRef.current) return;
    if (state.phase === 'result') feedback(state.outcome.allowed ? 'allowed' : 'denied');
    else if (state.phase === 'error') feedback('error');
  }, [state]);

  const submit = useCallback(async (): Promise<void> => {
    if (sending.current || !canSubmit(state) || state.phase !== 'entering') return;
    sending.current = true;
    const digits = state.digits;
    const mine = ++attempt.current;
    dispatch({ type: 'submit' });
    try {
      if (!navigator.onLine) throw new ApiError(0, 'NETWORK_ERROR', 'Sin conexión');
      const answer = await api.post<CheckResponse>('/access/checks', { id: crypto.randomUUID(), branch_id: branchId, document_number: digits });
      if (mine !== attempt.current) return;
      // The date comes from the server's clock, not from the tablet's.
      const today = todayInLima(new Date(answer.checked_at));
      dispatch({ type: 'answered', outcome: outcomeFromCheck(answer, today) });
    } catch (failure) {
      if (mine !== attempt.current) return;
      dispatch({ type: 'failed', failure: failureFromRequest(failure instanceof ApiError ? failure : { status: 0, code: 'NETWORK_ERROR' }) });
    }
  }, [branchId, state]);

  // Holding the logo for 3 seconds is the hidden way out.
  const holdTimer = useRef<number | undefined>(undefined);
  const startHold = (): void => {
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => setExiting(true), EXIT_HOLD_MS);
  };
  const stopHold = (): void => window.clearTimeout(holdTimer.current);
  useEffect(() => () => window.clearTimeout(holdTimer.current), []);

  const digits = state.phase === 'entering' || state.phase === 'checking' ? state.digits : '';
  const showingAnswer = state.phase === 'result' || state.phase === 'error';

  return (
    <div className="kiosk" onPointerDown={enterFullscreen} data-phase={state.phase}>
      {!online && (
        <div className="kiosk-offline" role="alert">
          Sin conexión: no se puede verificar el ingreso
        </div>
      )}
      <header className="kiosk-header">
        <div
          className="kiosk-brand"
          onPointerDown={startHold}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          onContextMenu={(event) => event.preventDefault()}
          data-testid="kiosk-logo"
        >
          <GymBrand name={gymName} logoUrl={logoUrl} />
        </div>
        <span className="kiosk-branch">{branchName}</span>
      </header>

      <main className="kiosk-main">
        <section className="kiosk-entry" aria-label="Documento">
          <h1>Ingresa tu DNI o carné de extranjería</h1>
          <div className="kiosk-display" data-testid="kiosk-display" aria-label={`${digits.length} números escritos`}>
            {maskDocument(digits) || <span className="kiosk-placeholder">Escribe tu número</span>}
          </div>
          <p className="kiosk-hint">{digits.length > 0 && digits.length < MIN_DOCUMENT_DIGITS ? `Faltan ${MIN_DOCUMENT_DIGITS - digits.length} números como mínimo` : ' '}</p>
        </section>
        <KioskKeypad
          onDigit={(value) => dispatch({ type: 'digit', value })}
          onBackspace={() => dispatch({ type: 'backspace' })}
          onSubmit={() => void submit()}
          submitDisabled={!canSubmit(state)}
          disabled={state.phase !== 'entering'}
        />
      </main>

      <footer className="kiosk-footer">
        <button
          type="button"
          className="kiosk-link"
          aria-pressed={sound}
          onClick={() => {
            setSound(!sound);
            setSoundEnabled(!sound);
          }}
        >
          Sonido: {sound ? 'sí' : 'no'}
        </button>
        {canGoFullscreen() && !fullscreen && (
          <button type="button" className="kiosk-link" onClick={enterFullscreen}>
            Pantalla completa
          </button>
        )}
      </footer>

      {state.phase === 'checking' && (
        <div className="kiosk-overlay kiosk-checking" role="status">
          Verificando…
        </div>
      )}
      {state.phase === 'result' && (
        <div className={`kiosk-overlay ${state.outcome.allowed ? 'kiosk-allowed' : 'kiosk-denied'}`} role="status" aria-live="assertive" data-testid="kiosk-result" data-allowed={state.outcome.allowed}>
          <Icon name={state.outcome.allowed ? 'check' : 'close'} size={160} />
          <p className="kiosk-headline">{state.outcome.headline}</p>
          <p className="kiosk-detail">{state.outcome.detail}</p>
          {state.outcome.endingSoon && <p className="kiosk-note">Tu membresía vence pronto. Renueva en recepción.</p>}
        </div>
      )}
      {state.phase === 'error' && (
        <div className="kiosk-overlay kiosk-failure" role="alert" aria-live="assertive" data-testid="kiosk-error" data-kind={state.failure.kind}>
          <Icon name="bell" size={140} />
          <p className="kiosk-headline">{state.failure.headline}</p>
          <p className="kiosk-detail">{state.failure.detail}</p>
        </div>
      )}
      {showingAnswer && <div className="kiosk-countdown" style={{ animationDuration: `${RESULT_RESET_MS}ms` }} aria-hidden="true" />}

      {exiting && (
        <KioskExitDialog
          onCancel={() => setExiting(false)}
          onAccepted={() => {
            exitFullscreen();
            onExit();
          }}
        />
      )}
    </div>
  );
}
