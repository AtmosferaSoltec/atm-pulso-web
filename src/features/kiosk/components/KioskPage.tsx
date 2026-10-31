import { useState, type FormEvent, type ReactElement } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { describeError } from '@/config/errorMessages';
import { useCatalog } from '@/features/gym';
import { useKioskSettings, useSetKioskPin } from '@/features/kiosk/hooks/useKiosk';
import { rememberBranch, rememberedBranch } from '@/features/kiosk/services/kioskPreferences';
import { openKiosk } from '@/features/kiosk/services/kioskRoute';
import { useCurrentUser } from '@/store/authStore';

/** The "Quiosco" page of the workspace: open the tablet screen, see its branch and (admin) set the exit PIN. */
export function KioskPage(): ReactElement {
  const user = useCurrentUser();
  const { branches } = useCatalog();
  const settings = useKioskSettings(true);
  const setPin = useSetKioskPin();
  const [pin, setPinText] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [remembered, setRemembered] = useState(() => rememberedBranch(user.id));

  const options = branches.filter((branch) => branch.accessible);
  const deviceBranch = options.find((branch) => branch.id === remembered);
  const pinSet = settings.data?.pin_set === true;
  const isAdmin = user.role === 'admin';

  async function savePin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await setPin.mutateAsync(pin);
      setPinText('');
      setMessage('PIN de salida guardado.');
    } catch (failure) {
      setError(describeError(failure));
    }
  }

  return (
    <div className="kiosk-page">
      <section className="card pricing-form">
        <div className="card-heading">
          <h2>Quiosco de ingreso</h2>
        </div>
        <p>
          Abre esta pantalla en la tablet de la puerta, con una cuenta de recepción de la sede. Cada ingreso queda registrado.
        </p>
        <div className="kiosk-page-actions">
          <Button onClick={openKiosk} disabled={!pinSet}>
            <Icon name="phone" size={18} /> Abrir quiosco
          </Button>
          {!settings.isPending && !pinSet && <span className="error">{isAdmin ? 'Define primero el PIN de salida.' : 'El administrador debe definir el PIN de salida.'}</span>}
        </div>
        {options.length > 1 && (
          <p>
            Sede de este dispositivo: <strong>{deviceBranch?.name ?? 'sin elegir (se pregunta al abrir)'}</strong>
            {deviceBranch && (
              <>
                {' '}
                <Button
                  variant="secondary"
                  onClick={() => {
                    rememberBranch(user.id, null);
                    setRemembered(null);
                  }}
                >
                  Cambiar
                </Button>
              </>
            )}
          </p>
        )}
      </section>

      {isAdmin && (
        <form className="card pricing-form" onSubmit={(event) => void savePin(event)}>
          <div className="card-heading">
            <h2>PIN de salida</h2>
          </div>
          <Field label={pinSet ? 'Nuevo PIN (4 a 8 números)' : 'PIN (4 a 8 números)'} required>
            <Input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              name="kiosk-exit-pin"
              pattern="[0-9]{4,8}"
              minLength={4}
              maxLength={8}
              required
              value={pin}
              onChange={(event) => setPinText(event.target.value.replace(/\D/g, '').slice(0, 8))}
            />
          </Field>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {message && <p role="status">{message}</p>}
          <Button type="submit" disabled={pin.length < 4 || setPin.isPending}>
            Guardar PIN
          </Button>
        </form>
      )}
    </div>
  );
}
