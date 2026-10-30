import { useState, type FormEvent, type ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import { useCatalog, branchTitle } from '@/features/organization';
import { useTeamMutations, useTeamUsers, type AssignableRole } from '@/features/team/hooks/useTeam';
import type { Role, TeamUser } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { OptionCards, type Option } from '@/components/ui/option-cards';

const roleOptions: Option<AssignableRole>[] = [
  { value: 'receptionist', label: 'Recepción', icon: 'access' },
  { value: 'admin', label: 'Administrador', icon: 'shield' },
];

const roleLabels: Record<Role, string> = {
  admin: 'Administrador',
  receptionist: 'Recepción',
};

const roleNotes: Record<AssignableRole, string> = {
  admin: 'Gestiona los usuarios, las tarifas y la identidad de los gimnasios. Accede a todas las sedes.',
  receptionist: 'Puede consultar miembros, inscribir, renovar, registrar pagos y controlar ingresos en sus sedes.',
};

interface Draft {
  id: string;
  isNew: boolean;
  fullName: string;
  documentNumber: string;
  role: AssignableRole;
  branchIds: string[];
}

export function TeamPage(): ReactElement {
  const { branches, branchLabel } = useCatalog();
  const team = useTeamUsers();
  const { create, update, setActive, resetPassword } = useTeamMutations();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [resetting, setResetting] = useState<TeamUser | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const branchChoices = branches.filter((branch) => branch.accessible);

  function newDraft(): Draft {
    return { id: '', isNew: true, fullName: '', documentNumber: '', role: 'receptionist', branchIds: [] };
  }

  function editDraft(user: TeamUser): Draft {
    return {
      id: user.id,
      isNew: false,
      fullName: user.full_name,
      documentNumber: user.document_number,
      role: user.role === 'admin' ? 'admin' : 'receptionist',
      branchIds: user.branches.map((branch) => branch.id),
    };
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!draft) return;
    if (!draft.fullName.trim()) return setError('Ingresa un nombre válido.');
    if (draft.role === 'receptionist' && !draft.branchIds.length) return setError('Selecciona al menos una sede para recepción.');
    const scope = draft.role === 'admin' ? {} : { branch_ids: draft.branchIds };
    try {
      if (draft.isNew) {
        await create.mutateAsync({ full_name: draft.fullName.trim(), document_number: draft.documentNumber, role: draft.role, ...scope });
        setMessage(`Usuario creado. Ingresa con su DNI ${draft.documentNumber}; su contraseña inicial es ese mismo DNI y la cambiará al entrar.`);
      } else {
        await update.mutateAsync({
          id: draft.id,
          changes: {
            full_name: draft.fullName.trim(),
            role: draft.role,
            ...scope,
          },
        });
        setMessage('Usuario actualizado.');
      }
      setDraft(null);
    } catch (failure) {
      setError(describeError(failure));
    }
  }

  async function toggle(user: TeamUser): Promise<void> {
    try {
      await setActive.mutateAsync({ id: user.id, active: !user.is_active });
      setMessage(user.is_active ? `${user.full_name} fue desactivado.` : `${user.full_name} fue activado.`);
    } catch (failure) {
      setMessage(describeError(failure));
    }
  }

  async function confirmReset(): Promise<void> {
    if (!resetting) return;
    try {
      await resetPassword.mutateAsync(resetting.id);
      setMessage(`Contraseña restablecida. ${resetting.full_name} ingresará con su DNI y creará una nueva.`);
    } catch (failure) {
      setMessage(describeError(failure));
    }
    setResetting(null);
  }

  function scopeOf(user: TeamUser): string {
    if (user.role === 'admin') return 'Todas las sedes';
    return user.branches.map((branch) => branchLabel(branch.id)).join(', ');
  }

  const users = team.data ?? [];

  return (
    <>
      <div className="section-intro">
        <div>
          <h2>Usuarios de la cuenta</h2>
        </div>
        <Button
          onClick={() => {
            setError('');
            setDraft(newDraft());
          }}
        >
          <Icon name="plus" size={16} /> Nuevo usuario
        </Button>
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {team.isError && (
        <p className="error" role="alert">
          {describeError(team.error)}
        </p>
      )}
      <section className="card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Sedes</th>
                <th>Estado</th>
                <th className="right">
                  <span className="visually-hidden">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.full_name}</strong>
                    <small>DNI {user.document_number}</small>
                  </td>
                  <td>{roleLabels[user.role]}</td>
                  <td>{scopeOf(user)}</td>
                  <td>
                    <span className={`badge ${user.is_active ? 'active' : 'expired'}`}>{user.is_active ? 'Activo' : 'Inactivo'}</span>
                  </td>
                  <td className="right">
                    {user.is_self ? (
                      <small>Tu cuenta</small>
                    ) : (
                      <div className="row-actions">
                        <IconButton
                          icon="edit"
                          label={`Editar a ${user.full_name}`}
                          onClick={() => {
                            setDraft(editDraft(user));
                            setError('');
                          }}
                        />
                        <IconButton icon="renewals" label={`Restablecer contraseña de ${user.full_name}`} onClick={() => setResetting(user)} />
                        <IconButton
                          icon={user.is_active ? 'close' : 'check'}
                          label={`${user.is_active ? 'Desactivar' : 'Activar'} a ${user.full_name}`}
                          onClick={() => void toggle(user)}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {team.isPending && (
                <tr>
                  <td colSpan={5}>Cargando…</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {draft && (
        <Dialog title={draft.isNew ? 'Nuevo usuario' : 'Editar usuario'} onClose={() => setDraft(null)}>
          <form className="form-grid" onSubmit={(event) => void submit(event)}>
            <Field label="Nombre completo" required className="full">
              <Input required value={draft.fullName} onChange={(event) => setDraft({ ...draft, fullName: event.target.value })} />
            </Field>
            <Field label="DNI" required className="full" hint={draft.isNew ? 'Será su usuario; la contraseña inicial es el mismo DNI.' : 'El DNI no se puede cambiar.'}>
              <Input
                required
                readOnly={!draft.isNew}
                inputMode="numeric"
                pattern="[0-9]{8}"
                maxLength={8}
                placeholder="8 dígitos"
                value={draft.documentNumber}
                onChange={(event) => setDraft({ ...draft, documentNumber: event.target.value.replace(/\D/g, '') })}
              />
            </Field>
            <Field label="Rol" className="full" as="div">
              <OptionCards label="Rol" options={roleOptions} value={draft.role} onChange={(role) => setDraft({ ...draft, role })} />
            </Field>
            <p className="notice full">{roleNotes[draft.role]}</p>
            {draft.role === 'receptionist' && (
              <fieldset className="branch-assignment full">
                <legend>Sedes asignadas</legend>
                {branchChoices.map((branch) => (
                  <label key={branch.id}>
                    <Input
                      type="checkbox"
                      checked={draft.branchIds.includes(branch.id)}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          branchIds: event.target.checked ? [...draft.branchIds, branch.id] : draft.branchIds.filter((id) => id !== branch.id),
                        })
                      }
                    />
                    {branchTitle(branch)}
                  </label>
                ))}
              </fieldset>
            )}
            {error && (
              <p className="error full" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions full">
              <small className="required-note">
                <b>*</b> Obligatorio
              </small>
              <Button variant="secondary" onClick={() => setDraft(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={create.isPending || update.isPending}>
                Guardar usuario
              </Button>
            </div>
          </form>
        </Dialog>
      )}
      {resetting && (
        <Dialog title="Restablecer contraseña" onClose={() => setResetting(null)}>
          <p>
            La contraseña de <strong>{resetting.full_name}</strong> volverá a ser su DNI y tendrá que crear una nueva al ingresar. Sus sesiones abiertas se cerrarán.
          </p>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setResetting(null)}>
              Cancelar
            </Button>
            <Button onClick={() => void confirmReset()} disabled={resetPassword.isPending}>
              Restablecer
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
