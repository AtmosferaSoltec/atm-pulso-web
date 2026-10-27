import { useState, type FormEvent, type ReactElement } from 'react';
import { useCurrentUser } from '@/store/authStore';
import type { Role } from '@/types/api.types';
import { MIN_PASSWORD_LENGTH, useProfile } from '@/features/auth/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';

const roleLabels: Record<Role, string> = {
  superadmin: 'Superadmin',
  owner: 'Propietario',
  admin: 'Administrador',
  receptionist: 'Recepción',
};

interface ProfileDialogProps {
  onClose: () => void;
}

/** "Mi perfil": every user can see their data, edit the non-sensitive ones and change their password. */
export function ProfileDialog({ onClose }: ProfileDialogProps): ReactElement {
  const user = useCurrentUser();
  const { updateProfile, changePassword } = useProfile();

  const [name, setName] = useState(user.full_name);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [dataError, setDataError] = useState('');
  const [dataSaved, setDataSaved] = useState(false);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  const scope =
    user.role === 'superadmin'
      ? 'Todas las cuentas de clientes'
      : user.role === 'owner'
        ? 'Todos tus gimnasios y sedes'
        : user.role === 'admin'
          ? `${user.gym?.name ?? 'Tu gimnasio'} · todas las sedes`
          : user.branches.map((branch) => `${branch.gym_name} · ${branch.name}`).join(', ');

  async function saveData(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const error = await updateProfile({ name, phone });
    setDataError(error ?? '');
    setDataSaved(!error);
  }

  async function savePassword(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const error = await changePassword(current, next, confirm);
    setPasswordError(error ?? '');
    setPasswordSaved(!error);
    if (!error) {
      setCurrent('');
      setNext('');
      setConfirm('');
    }
  }

  const passwordType = showPasswords ? 'text' : 'password';

  return (
    <Dialog title="Mi perfil" onClose={onClose}>
      <form className="form-grid profile-form" onSubmit={(event) => void saveData(event)}>
        <h3 className="profile-heading full">Mis datos</h3>
        <Field label="Nombre completo" required className="full">
          <Input
            required
            minLength={3}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setDataSaved(false);
            }}
          />
        </Field>
        <Field label="Celular (+51)" className="full">
          <Input
            inputMode="tel"
            pattern="9[0-9]{8}"
            maxLength={9}
            placeholder="999999999"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value.replace(/\D/g, ''));
              setDataSaved(false);
            }}
          />
        </Field>
        <dl className="profile-readonly full">
          <div>
            <dt>DNI</dt>
            <dd>{user.document_number}</dd>
          </div>
          <div>
            <dt>Rol</dt>
            <dd>{roleLabels[user.role]}</dd>
          </div>
          <div className="wide">
            <dt>Acceso</dt>
            <dd>{scope}</dd>
          </div>
        </dl>
        {dataError && (
          <p role="alert" className="error full">
            {dataError}
          </p>
        )}
        {dataSaved && (
          <p role="status" className="notice full">
            Datos actualizados.
          </p>
        )}
        <div className="form-actions full">
          <small className="required-note">
            <b>*</b> Obligatorio
          </small>
          <Button type="submit">Guardar datos</Button>
        </div>
      </form>

      <form className="form-grid profile-form profile-password" onSubmit={(event) => void savePassword(event)}>
        <div className="profile-heading-row full">
          <h3 className="profile-heading">Cambiar contraseña</h3>
          <IconButton
            icon={showPasswords ? 'eyeOff' : 'eye'}
            label={showPasswords ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
            onClick={() => setShowPasswords(!showPasswords)}
          />
        </div>
        <Field label="Contraseña actual" required className="full">
          <Input required type={passwordType} autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} />
        </Field>
        <Field label="Nueva contraseña" required hint={`Al menos ${MIN_PASSWORD_LENGTH} caracteres.`}>
          <Input required type={passwordType} autoComplete="new-password" value={next} onChange={(event) => setNext(event.target.value)} />
        </Field>
        <Field label="Repetir nueva contraseña" required>
          <Input required type={passwordType} autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
        </Field>
        {passwordError && (
          <p role="alert" className="error full">
            {passwordError}
          </p>
        )}
        {passwordSaved && (
          <p role="status" className="notice full">
            Contraseña actualizada. Úsala la próxima vez que inicies sesión.
          </p>
        )}
        <div className="form-actions full">
          <Button type="submit" variant="secondary">
            Cambiar contraseña
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
