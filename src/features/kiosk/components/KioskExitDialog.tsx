import { useEffect, useRef, useState, type ReactElement } from 'react';
import { ApiError } from '@/config/apiClient';
import { verifyKioskPin } from '@/features/kiosk/hooks/useKiosk';
import { maskPin, pinFailureText } from '@/features/kiosk/services/kioskScreen';
import { KioskKeypad } from '@/features/kiosk/components/KioskKeypad';

const MAX_PIN_DIGITS = 8;
const MIN_PIN_DIGITS = 4;
/** The dialog closes by itself so a forgotten one never stays open at the door. */
const DIALOG_IDLE_MS = 30_000;

interface KioskExitDialogProps {
  onCancel: () => void;
  /** The API accepted the PIN. */
  onAccepted: () => void;
}

/** Asks for the exit PIN. The API checks it (hash per gym, throttled); nothing about it is kept here. */
export function KioskExitDialog({ onCancel, onAccepted }: KioskExitDialogProps): ReactElement {
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);

  useEffect(() => {
    const timeout = window.setTimeout(onCancel, DIALOG_IDLE_MS);
    return () => window.clearTimeout(timeout);
  }, [pin, message, onCancel]);

  async function submit(): Promise<void> {
    if (sending.current || pin.length < MIN_PIN_DIGITS) return;
    sending.current = true;
    setBusy(true);
    try {
      await verifyKioskPin(pin);
      onAccepted();
    } catch (failure) {
      setMessage(failure instanceof ApiError ? pinFailureText(failure) : 'No se pudo comprobar el PIN.');
      setPin('');
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="kiosk-modal" role="dialog" aria-modal="true" aria-labelledby="kiosk-exit-title">
      <div className="kiosk-modal-card">
        <h2 id="kiosk-exit-title">PIN de salida</h2>
        <div className="kiosk-pin-display" aria-label={`${pin.length} números escritos`} data-testid="kiosk-pin-display">
          {maskPin(pin.length) || ' '}
        </div>
        <p className="kiosk-modal-message" role="alert">
          {message}
        </p>
        <KioskKeypad
          onDigit={(digit) => {
            setMessage('');
            setPin((current) => (current.length < MAX_PIN_DIGITS ? current + digit : current));
          }}
          onBackspace={() => setPin((current) => current.slice(0, -1))}
          onSubmit={() => void submit()}
          submitDisabled={pin.length < MIN_PIN_DIGITS}
          disabled={busy}
          submitLabel="Salir"
        />
        <button type="button" className="kiosk-link" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
