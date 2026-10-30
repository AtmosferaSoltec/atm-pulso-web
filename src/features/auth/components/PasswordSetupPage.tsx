import { useState, type FormEvent, type ReactElement } from 'react';
import { useAuth } from '@/store/authStore';
import { describeError } from '@/config/errorMessages';
import { changePassword } from '@/features/auth/services/authSession';
import { MIN_PASSWORD_LENGTH, validateNewPassword } from '@/features/auth/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { BrandMark } from '@/components/ui/brand-mark';
import { Icon } from '@/components/ui/icon';

interface PasswordSetupPageProps {
  documentNumber: string;
  /** The password the person just typed: atm-auth-api accepted it but issues no session until it is replaced. */
  temporaryPassword: string;
  onCancel: () => void;
}

/**
 * First sign-in: the temporary password is the DNI, so nothing else works until the user creates their own.
 * atm-auth-api ends every session when the password changes, so the new one is used to sign in right after.
 */
export function PasswordSetupPage({ documentNumber, temporaryPassword, onCancel }: PasswordSetupPageProps): ReactElement {
  const { login } = useAuth();
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const invalid = validateNewPassword(temporaryPassword, next, confirm);
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    try {
      await changePassword(documentNumber, temporaryPassword, next);
      const user = await login(documentNumber, next);
      window.location.hash = user.role === 'receptionist' ? 'access' : 'dashboard';
    } catch (failure) {
      setError(describeError(failure));
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-form-panel">
        <div className="login-form-wrap">
          <a className="brand" href="#login">
            <BrandMark size={44} />
            pulso<span className="brand-dot">.</span>
          </a>
          <span className="login-lock">
            <Icon name="shield" size={24} />
          </span>
          <h2>Crea tu contraseña</h2>
          <p>Para continuar, crea una contraseña nueva.</p>
          <form onSubmit={submit} className="login-form">
            <Field label="Nueva contraseña" required hint={`Al menos ${MIN_PASSWORD_LENGTH} caracteres.`}>
              <div className="password-field">
                <Input required type={show ? 'text' : 'password'} autoComplete="new-password" value={next} onChange={(event) => { setNext(event.target.value); setError(''); }} />
                <IconButton icon={show ? 'eyeOff' : 'eye'} label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShow(!show)} tabIndex={-1} />
              </div>
            </Field>
            <Field label="Repetir contraseña" required>
              <Input required type={show ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(event) => { setConfirm(event.target.value); setError(''); }} />
            </Field>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy}>
              Guardar contraseña <Icon name="arrow" size={17} />
            </Button>
            <Button variant="secondary" onClick={onCancel}>
              Volver
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
