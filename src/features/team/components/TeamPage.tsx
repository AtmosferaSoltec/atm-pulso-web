import { useState, type ReactElement, type FormEvent } from 'react';
import { useDemoStore } from '@/store/demoStore';
import { canAccessBranch, canManageGym, type DemoUser } from '@/features/auth';
import { useOrganizationCatalog } from '@/features/organization';
import { useTeam } from '@/features/team/hooks/useTeam';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { OptionCards, type Option } from '@/components/ui/option-cards';

type AssignableRole = 'receptionist' | 'admin';

const roleOptions: Option<AssignableRole>[] = [
  { value: 'receptionist', label: 'Recepción', icon: 'access' },
  { value: 'admin', label: 'Administrador', icon: 'shield' },
];

const roleLabels: Record<DemoUser['role'], string> = {
  superadmin: 'Superadmin',
  owner: 'Propietario',
  admin: 'Administrador',
  receptionist: 'Recepción',
};

const roleNotes: Record<AssignableRole, string> = {
  admin: 'Gestiona los usuarios y la identidad de su gimnasio. No puede crear gimnasios.',
  receptionist: 'Puede consultar miembros, inscribir, renovar, registrar pagos y controlar ingresos en sus sedes.',
};

interface TeamPageProps {
  organizationId: string;
  readOnly?: boolean;
}

export function TeamPage({ organizationId, readOnly = false }: TeamPageProps): ReactElement {
  const { users, saveUser, toggleUser } = useTeam(organizationId);
  const { currentUser, state } = useDemoStore();
  const { gyms, organizationBranches, branchLabel } = useOrganizationCatalog();
  const [draft, setDraft] = useState<DemoUser | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // What the signed-in user may assign: an owner everything, an admin only their own gym.
  const gymChoices = gyms.filter((gym) => gym.organizationId === organizationId && canManageGym(currentUser, gym.id));
  const branchChoices = organizationBranches(organizationId).filter((branch) => !!currentUser && canAccessBranch(currentUser, branch));
  const gymOptions: Option<string>[] = gymChoices.map((gym) => ({ value: gym.id, label: gym.name, icon: 'building' }));
  // Only the owner can appoint administrators; an admin creates reception staff.
  const canAssignAdmins = currentUser?.role === 'owner';
  const roleChoices = canAssignAdmins ? roleOptions : roleOptions.filter((option) => option.value === 'receptionist');
  const gymName = (id?: string): string => gyms.find((gym) => gym.id === id)?.name ?? '';

  function newUser(): DemoUser {
    return { id: crypto.randomUUID(), name: '', dni: '', role: 'receptionist', organizationId, branchIds: [], active: true };
  }

  function changeRole(role: AssignableRole): void {
    if (!draft) return;
    setDraft({ ...draft, role, gymId: role === 'admin' ? (draft.gymId ?? gymChoices[0]?.id) : undefined });
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!draft || readOnly) return;
    if (!draft.name.trim()) return setError('Ingresa un nombre válido.');
    if (state.users.some((user) => user.id !== draft.id && user.dni === draft.dni.trim())) return setError('Este DNI ya pertenece a otro usuario.');
    if (draft.role === 'receptionist' && !draft.branchIds.length) return setError('Selecciona al menos una sede para recepción.');
    if (draft.role === 'admin' && !canAssignAdmins) return setError('Solo el propietario puede crear administradores.');
    if (draft.role === 'admin' && !draft.gymId) return setError('Selecciona el gimnasio que administrará.');
    saveUser({ ...draft, name: draft.name.trim(), dni: draft.dni.trim() });
    setDraft(null);
    setMessage('Usuario guardado. Puede iniciar sesión con su DNI y la contraseña de prueba Pulso2026!.');
  }

  function scopeOf(user: DemoUser): string {
    if (user.role === 'owner') return 'Todos los gimnasios';
    if (user.role === 'admin') return `${gymName(user.gymId)} · todas las sedes`;
    return user.branchIds.map(branchLabel).join(', ');
  }

  const editing = !!draft && users.some((user) => user.id === draft.id);

  return (
    <>
      <div className="section-intro">
        <div>
          <h2>Usuarios de la cuenta</h2>
        </div>
        {!readOnly && (
          <Button
            onClick={() => {
              setError('');
              setDraft(newUser());
            }}
          >
            <Icon name="plus" size={16} /> Nuevo usuario
          </Button>
        )}
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
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
                {!readOnly && (
                  <th className="right">
                    <span className="visually-hidden">Acciones</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                    <small>DNI {user.dni}</small>
                  </td>
                  <td>{roleLabels[user.role]}</td>
                  <td>{scopeOf(user)}</td>
                  <td>
                    <span className={`badge ${user.active === false ? 'expired' : 'active'}`}>{user.active === false ? 'Inactivo' : 'Activo'}</span>
                  </td>
                  {!readOnly && (
                    <td className="right">
                      {user.id === currentUser?.id || user.role === 'owner' ? (
                        <small>{user.id === currentUser?.id ? 'Tu cuenta' : ''}</small>
                      ) : (
                        <div className="row-actions">
                          <IconButton
                            icon="edit"
                            label={`Editar a ${user.name}`}
                            onClick={() => {
                              setDraft({ ...user });
                              setError('');
                            }}
                          />
                          <IconButton
                            icon={user.active === false ? 'check' : 'close'}
                            label={`${user.active === false ? 'Activar' : 'Desactivar'} a ${user.name}`}
                            onClick={() => toggleUser(user.id)}
                          />
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {draft && (
        <Dialog title={editing ? 'Editar usuario' : 'Nuevo usuario'} onClose={() => setDraft(null)}>
          <form className="form-grid" onSubmit={submit}>
            <Field label="Nombre completo" required className="full">
              <Input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </Field>
            <Field label="DNI" required className="full">
              <Input
                required
                inputMode="numeric"
                pattern="[0-9]{8}"
                maxLength={8}
                placeholder="8 dígitos"
                value={draft.dni}
                onChange={(event) => setDraft({ ...draft, dni: event.target.value.replace(/\D/g, '') })}
              />
            </Field>
            {roleChoices.length > 1 && (
              <Field label="Rol" className="full" as="div">
                <OptionCards label="Rol" options={roleChoices} value={draft.role === 'admin' ? 'admin' : 'receptionist'} onChange={changeRole} />
              </Field>
            )}
            {draft.role === 'admin' && gymOptions.length > 1 && (
              <Field label="Gimnasio que administra" className="full" as="div">
                <OptionCards
                  label="Gimnasio que administra"
                  variant="chip"
                  options={gymOptions}
                  value={draft.gymId ?? ''}
                  onChange={(gymId) => setDraft({ ...draft, gymId })}
                />
              </Field>
            )}
            <p className="notice full">{roleNotes[draft.role === 'admin' ? 'admin' : 'receptionist']}</p>
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
                    {branchLabel(branch.id)}
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
              <Button type="submit">Guardar usuario</Button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}
