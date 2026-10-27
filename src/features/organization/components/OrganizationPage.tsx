import { useState, type ReactElement } from 'react';
import { useCurrentUser } from '@/store/authStore';
import { canManageGym } from '@/features/auth';
import { describeError } from '@/config/errorMessages';
import { useCatalog } from '@/features/organization/hooks/useCatalog';
import { useUpdateGym } from '@/features/organization/hooks/useUpdateGym';
import { gymTitle } from '@/features/organization/services/catalog';
import type { CatalogGym } from '@/types/api.types';
import { Icon } from '@/components/ui/icon';
import { FREE_PLAN_SUMMARY } from '@/config/freePlan';
import { Input } from '@/components/ui/input';

interface OrganizationPageProps {
  /** The superadmin only consults: every gym is listed and nothing can be changed. */
  readOnly?: boolean;
}

function SharingRule({ gym, readOnly, onMessage }: { gym: CatalogGym; readOnly: boolean; onMessage: (text: string) => void }): ReactElement {
  const user = useCurrentUser();
  const update = useUpdateGym(gym.id);
  const editable = !readOnly && canManageGym(user, gym.id);

  async function change(allowed: boolean): Promise<void> {
    try {
      await update.mutateAsync({ branch_sharing: allowed });
      onMessage(`Acceso entre sedes ${allowed ? 'activado' : 'desactivado'} en ${gymTitle(gym)}.`);
    } catch (error) {
      onMessage(describeError(error));
    }
  }

  return (
    <label className="setting-row gym-rule">
      <span>
        <strong>Acceso entre sedes</strong>
        <small>Si lo desactivas, los miembros de este gimnasio solo ingresan a su sede de inscripción.</small>
      </span>
      <Input
        type="checkbox"
        aria-label={`Acceso entre sedes de ${gymTitle(gym)}`}
        disabled={!editable || update.isPending}
        // Shows the choice at once; if the server refuses, the saved value comes back.
        checked={update.isPending ? (update.variables?.branch_sharing ?? gym.branch_sharing) : gym.branch_sharing}
        onChange={(event) => void change(event.target.checked)}
      />
    </label>
  );
}

/** Gyms and branches of the account, with the rules each gym's administrator controls. */
export function OrganizationPage({ readOnly = false }: OrganizationPageProps): ReactElement {
  const user = useCurrentUser();
  const { gyms, branches } = useCatalog();
  const [message, setMessage] = useState('');
  // Owners see every gym; an administrator only the one they manage.
  const visibleGyms = gyms.filter((gym) => readOnly || canManageGym(user, gym.id));
  const hasManyBranches = branches.length > 1;

  return (
    <div className="organization-single">
      <section className="card">
        <div className="card-heading">
          <h2>Gimnasios y sedes</h2>
        </div>
        <div className="gym-list">
          {visibleGyms.map((gym) => (
            <article key={gym.id}>
              <h3>{gymTitle(gym)}</h3>
              {gym.tax_id && <small>RUC {gym.tax_id}</small>}
              <div>
                {gym.branches.map((branch) => (
                  <span className="subtle-pill" key={branch.id}>
                    {branch.name}
                  </span>
                ))}
              </div>
              {hasManyBranches && <SharingRule gym={gym} readOnly={readOnly} onMessage={setMessage} />}
            </article>
          ))}
        </div>
        {message && (
          <p className="notice gym-rule-message" role="status">
            {message}
          </p>
        )}
        <p className="footnote">Plan gratuito: {FREE_PLAN_SUMMARY}. Para incorporar más gimnasios o sedes, contacta a Atmósfera.</p>
      </section>
      {!hasManyBranches && (
        <section className="card single-location-note">
          <Icon name="shield" size={28} />
          <h3>Operación de una sola sede</h3>
          <p>Tu cuenta trabaja con una única sede, así que no hay reglas entre sedes que ajustar.</p>
        </section>
      )}
    </div>
  );
}
