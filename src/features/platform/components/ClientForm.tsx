import { useState, type FormEvent, type ReactElement } from 'react';
import { useDemoStore } from '@/store/demoStore';
import type { ClientDraft, GymDraft } from '@/features/platform/types/platform.types';
import type { Branch } from '@/features/organization';
import { lookupDni, lookupRuc } from '@/services/documentLookup';
import { hasExtras, planExtras } from '@/config/freePlan';
import { PlanExtraNotice } from '@/features/platform/components/PlanExtraNotice';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { LookupInput } from '@/components/ui/lookup-input';

function emptyGym(): GymDraft {
  return { id: crypto.randomUUID(), name: '', taxId: '', branches: [{ id: crypto.randomUUID(), name: '', address: '' }] };
}

const emptyDraft: ClientDraft = { contactDni: '', firstName: '', lastName: '', contactEmail: '', contactPhone: '', gyms: [] };

const onlyDigits = (value: string): string => value.replace(/\D/g, '');

interface ClientFormProps {
  /** When set, the form only adds a gym to this existing client. */
  organizationName?: string;
  /** Branch counts of the client's existing gyms, so adding one counts against the free plan. */
  existingGymBranchCounts?: number[];
  onSave: (draft: ClientDraft) => void;
  onClose: () => void;
}

export function ClientForm({ organizationName, existingGymBranchCounts = [], onSave, onClose }: ClientFormProps): ReactElement {
  const { state } = useDemoStore();
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<ClientDraft>({ ...emptyDraft, gyms: [emptyGym()] });
  /** Which search button is waiting for its (mock) answer: "dni" or "ruc-<gym id>". */
  const [searching, setSearching] = useState<string | null>(null);
  const [extraConfirmed, setExtraConfirmed] = useState(false);
  const extras = planExtras([...existingGymBranchCounts, ...draft.gyms.map((gym) => gym.branches.length)]);

  function changeGym(id: string, patch: Partial<GymDraft>): void {
    setDraft((current) => ({ ...current, gyms: current.gyms.map((gym) => (gym.id === id ? { ...gym, ...patch } : gym)) }));
  }

  function changeBranch(gymId: string, branchId: string, patch: Partial<Branch>): void {
    setDraft((current) => ({
      ...current,
      gyms: current.gyms.map((gym) =>
        gym.id === gymId
          ? { ...gym, branches: gym.branches.map((branch) => (branch.id === branchId ? { ...branch, ...patch } : branch)) }
          : gym,
      ),
    }));
  }

  async function searchDni(): Promise<void> {
    setError('');
    setSearching('dni');
    const person = await lookupDni(draft.contactDni);
    setSearching(null);
    if (!person) {
      setError('Ingresa un DNI de 8 dígitos para buscar.');
      return;
    }
    setDraft((current) => ({ ...current, firstName: person.firstName, lastName: person.lastName }));
  }

  async function searchRuc(gym: GymDraft): Promise<void> {
    setError('');
    setSearching(`ruc-${gym.id}`);
    const company = await lookupRuc(gym.taxId);
    setSearching(null);
    if (!company) {
      setError('Ingresa un RUC de 11 dígitos para buscar.');
      return;
    }
    const [firstBranch] = gym.branches;
    changeGym(gym.id, {
      name: company.legalName,
      branches: gym.branches.map((branch) =>
        branch.id === firstBranch.id && !branch.address ? { ...branch, address: company.address } : branch,
      ),
    });
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!organizationName && state.users.some((user) => user.dni === draft.contactDni.trim())) {
      setError('Ya existe un usuario con este DNI.');
      return;
    }
    if (draft.gyms.some((gym) => !gym.name.trim() || gym.branches.some((branch) => !branch.name.trim()))) {
      setError('Completa los nombres de los gimnasios y sus sedes.');
      return;
    }
    onSave(draft);
  }

  return (
    <Dialog title={organizationName ? `Añadir gimnasio a ${organizationName}` : 'Nuevo cliente'} wide onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        {!organizationName && (
          <>
            <Field label="DNI" required>
              <LookupInput
                aria-label="DNI del cliente"
                inputMode="numeric"
                pattern="[0-9]{8}"
                maxLength={8}
                required
                placeholder="8 dígitos"
                value={draft.contactDni}
                searchLabel="Buscar DNI"
                searching={searching === 'dni'}
                onChange={(event) => setDraft({ ...draft, contactDni: onlyDigits(event.target.value) })}
                onSearch={searchDni}
              />
            </Field>
            <Field label="Celular (+51)" required>
              <Input
                inputMode="tel"
                pattern="9[0-9]{8}"
                maxLength={9}
                required
                placeholder="999999999"
                value={draft.contactPhone}
                onChange={(event) => setDraft({ ...draft, contactPhone: onlyDigits(event.target.value) })}
              />
            </Field>
            <Field label="Nombres" required>
              <Input required value={draft.firstName} onChange={(event) => setDraft({ ...draft, firstName: event.target.value })} />
            </Field>
            <Field label="Apellidos" required>
              <Input required value={draft.lastName} onChange={(event) => setDraft({ ...draft, lastName: event.target.value })} />
            </Field>
            <Field label="Correo electrónico" required className="full">
              <Input
                required
                type="email"
                placeholder="nombre@correo.com"
                value={draft.contactEmail}
                onChange={(event) => setDraft({ ...draft, contactEmail: event.target.value })}
              />
            </Field>
          </>
        )}
        {draft.gyms.map((gym, index) => (
          <section className="gym-draft full" key={gym.id}>
            <div className="draft-heading">
              <h3>Gimnasio {index + 1}</h3>
              {draft.gyms.length > 1 && (
                <Button
                  variant="ghost"
                  aria-label={`Quitar gimnasio ${index + 1}`}
                  onClick={() => setDraft({ ...draft, gyms: draft.gyms.filter((item) => item.id !== gym.id) })}
                >
                  <Icon name="close" size={16} />
                </Button>
              )}
            </div>
            <div className="form-grid">
              <Field label="RUC">
                <LookupInput
                  aria-label={`RUC del gimnasio ${index + 1}`}
                  inputMode="numeric"
                  pattern="[0-9]{11}"
                  maxLength={11}
                  placeholder="11 dígitos"
                  value={gym.taxId}
                  searchLabel={`Buscar RUC del gimnasio ${index + 1}`}
                  searching={searching === `ruc-${gym.id}`}
                  onChange={(event) => changeGym(gym.id, { taxId: onlyDigits(event.target.value) })}
                  onSearch={() => searchRuc(gym)}
                />
              </Field>
              <Field label="Nombre del gimnasio" required>
                <Input
                  required
                  aria-label={`Nombre del gimnasio ${index + 1}`}
                  value={gym.name}
                  onChange={(event) => changeGym(gym.id, { name: event.target.value })}
                />
              </Field>
              {gym.branches.map((branch, branchIndex) => (
                <div className="branch-draft full" key={branch.id}>
                  <Field label="Nombre de la sede" required>
                    <Input
                      required
                      aria-label={`Sede ${branchIndex + 1} del gimnasio ${index + 1}`}
                      value={branch.name}
                      onChange={(event) => changeBranch(gym.id, branch.id, { name: event.target.value })}
                    />
                  </Field>
                  <Field label="Dirección">
                    <Input
                      aria-label={`Dirección ${branchIndex + 1} del gimnasio ${index + 1}`}
                      value={branch.address}
                      onChange={(event) => changeBranch(gym.id, branch.id, { address: event.target.value })}
                    />
                  </Field>
                  {gym.branches.length > 1 && (
                    <Button
                      variant="ghost"
                      aria-label={`Quitar sede ${branchIndex + 1} del gimnasio ${index + 1}`}
                      onClick={() => changeGym(gym.id, { branches: gym.branches.filter((item) => item.id !== branch.id) })}
                    >
                      <Icon name="close" size={16} />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                className="full"
                variant="secondary"
                onClick={() => changeGym(gym.id, { branches: [...gym.branches, { id: crypto.randomUUID(), name: '', address: '' }] })}
              >
                <Icon name="plus" size={15} /> Añadir sede al gimnasio {index + 1}
              </Button>
            </div>
          </section>
        ))}
        {!organizationName && (
          <Button className="full" variant="secondary" onClick={() => setDraft({ ...draft, gyms: [...draft.gyms, emptyGym()] })}>
            <Icon name="plus" size={16} /> Añadir otro gimnasio
          </Button>
        )}
        {hasExtras(extras) && <PlanExtraNotice extras={extras} confirmed={extraConfirmed} onConfirmedChange={setExtraConfirmed} />}
        {error && (
          <p className="error full" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions full">
          <small className="required-note">
            <b>*</b> Obligatorio
          </small>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">{organizationName ? 'Guardar gimnasio' : 'Crear cliente y administrador'}</Button>
        </div>
      </form>
    </Dialog>
  );
}
