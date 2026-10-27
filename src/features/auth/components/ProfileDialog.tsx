import { useState, type FormEvent, type ReactElement } from 'react';
import type { DemoUser } from '@/features/auth/types/auth.types';
import { MIN_PASSWORD_LENGTH, useProfile } from '@/features/auth/hooks/useProfile';
import { useOrganizationCatalog } from '@/features/organization';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';

const roleLabels: Record<DemoUser['role'], string> = {
  superadmin: 'Superadmin',
  owner: 'Propietario',
  admin: 'Administrador',
  receptionist: 'Recepción',
};

interface ProfileDialogProps {
  user: DemoUser;
  onClose: () => void;
}

/** "Mi perfil": every user can see their data, edit the non-sensitive ones and change their password. */
export function ProfileDialog({ user, onClose }: ProfileDialogProps): ReactElement {
  const { updateProfile, changePassword } = useProfile();
  const { gyms, branchLabel } = useOrganizationCatalog();

  const [name, setName] = useState(user.name);
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
          ? `${gyms.find((gym) => gym.id === user.gymId)?.name ?? 'Tu gimnasio'} · todas las sedes`
          : user.branchIds.map(branchLabel).join(', ');

  function saveData(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const error = updateProfile({ name, phone });
    setDataError(error ?? '');
    setDataSaved(!error);
  }

  function savePassword(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const error = changePassword(current, next, confirm);
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
      <form className="form-grid profile-form" onSubmit={saveData}>
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
            <dd>{user.dni}</dd>
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

      <form className="form-grid profile-form profile-password" onSubmit={savePassword}>
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
