import { useState, type ReactElement } from 'react';
import { useDemoStore } from '@/store/demoStore';
import { canManageGym } from '@/features/auth';
import { useOrganizationCatalog } from '@/features/organization/hooks/useOrganizationCatalog';
import type { Gym } from '@/features/organization/types/organization.types';
import { Icon } from '@/components/ui/icon';
import { FREE_PLAN_SUMMARY } from '@/config/freePlan';
import { Input } from '@/components/ui/input';

interface OrganizationPageProps {
  organizationId: string;
  /** The superadmin only consults: every gym is listed and nothing can be changed. */
  readOnly?: boolean;
}

/** Gyms and branches of the account, with the rules each gym's administrator controls. */
export function OrganizationPage({ organizationId, readOnly = false }: OrganizationPageProps): ReactElement {
  const { setState, currentUser } = useDemoStore();
  const { gyms, organizationBranches } = useOrganizationCatalog();
  const [message, setMessage] = useState('');
  const accountBranches = organizationBranches(organizationId);
  // Owners see every gym; an administrator only the one they manage.
  const visibleGyms = gyms.filter((gym) => gym.organizationId === organizationId && (readOnly || canManageGym(currentUser, gym.id)));
  const hasManyBranches = accountBranches.length > 1;

  function setBranchSharing(gym: Gym, allowed: boolean): void {
    if (readOnly || !canManageGym(currentUser, gym.id)) return;
    setState((current) => ({ ...current, gyms: current.gyms.map((item) => (item.id === gym.id ? { ...item, branchSharing: allowed } : item)) }));
    setMessage(`Acceso entre sedes ${allowed ? 'activado' : 'desactivado'} en ${gym.name}.`);
  }

  return (
    <div className="organization-single">
      <section className="card">
        <div className="card-heading">
          <h2>Gimnasios y sedes</h2>
        </div>
        <div className="gym-list">
          {visibleGyms.map((gym) => (
            <article key={gym.id}>
              <h3>{gym.name}</h3>
              <small>RUC {gym.taxId}</small>
              <div>
                {accountBranches
                  .filter((branch) => branch.gymId === gym.id)
                  .map((branch) => (
                    <span className="subtle-pill" key={branch.id}>
                      {branch.name}
                    </span>
                  ))}
              </div>
              {hasManyBranches && (
                <label className="setting-row gym-rule">
                  <span>
                    <strong>Acceso entre sedes</strong>
                    <small>Si lo desactivas, los miembros de este gimnasio solo ingresan a su sede de inscripción.</small>
                  </span>
                  <Input
                    type="checkbox"
                    aria-label={`Acceso entre sedes de ${gym.name}`}
                    disabled={readOnly}
                    checked={gym.branchSharing !== false}
                    onChange={(event) => setBranchSharing(gym, event.target.checked)}
                  />
                </label>
              )}
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
