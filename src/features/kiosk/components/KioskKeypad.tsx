import type { ReactElement } from 'react';

interface KioskKeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  /** The confirm key cannot be pressed (not enough digits, or waiting for an answer). */
  submitDisabled: boolean;
  /** Every key is dead while the server is being asked. */
  disabled?: boolean;
  submitLabel?: string;
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** A very large numeric keypad: every key is at least 72 px, laid out as a phone's. */
export function KioskKeypad({ onDigit, onBackspace, onSubmit, submitDisabled, disabled = false, submitLabel = 'Entrar' }: KioskKeypadProps): ReactElement {
  return (
    <div className="kiosk-keypad" role="group" aria-label="Teclado numérico">
      {DIGITS.map((digit) => (
        <button key={digit} type="button" className="kiosk-key" disabled={disabled} onClick={() => onDigit(digit)}>
          {digit}
        </button>
      ))}
      <button type="button" className="kiosk-key kiosk-key-minor" disabled={disabled} onClick={onBackspace} aria-label="Borrar el último número">
        ⌫
      </button>
      <button type="button" className="kiosk-key" disabled={disabled} onClick={() => onDigit('0')}>
        0
      </button>
      <button type="button" className="kiosk-key kiosk-key-submit" disabled={disabled || submitDisabled} onClick={onSubmit}>
        {submitLabel}
      </button>
    </div>
  );
}
