import { useState, type FormEvent, type ReactElement } from 'react';
import { useAuth } from '@/store/authStore';
import { describeError } from '@/config/errorMessages';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAddBranch, useAddGym, useClients, useClientSummary, useCreateClient } from '@/features/platform/hooks/usePlatform';
import { ClientForm } from '@/features/platform/components/ClientForm';
import { gymTitle } from '@/features/organization';
import { ProfileDialog } from '@/features/auth';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import type { CatalogGym } from '@/types/api.types';

const PAGE_SIZES = [12, 24, 48];

function AddBranchDialog({ gym, onClose, onDone }: { gym: CatalogGym; onClose: () => void; onDone: (message: string) => void }): ReactElement {
  const add = useAddBranch(gym.id);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await add.mutateAsync({ name: String(data.get('name')), address: String(data.get('address')) });
      onDone('Sede creada.');
    } catch (failure) {
      setError(describeError(failure));
    }
  }

  return (
    <Dialog title="Añadir sede" onClose={onClose}>
      <form className="form-grid" onSubmit={(event) => void submit(event)}>
        <label className="full">
          Nombre de la sede
          <Input name="name" required />
        </label>
        <label className="full">
          Dirección
          <Input name="address" />
        </label>
        {error && (
          <p className="error full" role="alert">
            {error}
          </p>
        )}
        <Button className="full" type="submit" disabled={add.isPending}>
          Guardar sede
        </Button>
      </form>
    </Dialog>
  );
}

function AddGymForm({ clientId, clientName, onClose, onDone }: { clientId: string; clientName: string; onClose: () => void; onDone: (message: string) => void }): ReactElement {
  const addGym = useAddGym(clientId);
  return (
    <ClientForm
      organizationName={clientName}
      onClose={onClose}
      onSave={async (draft) => {
        await addGym.mutateAsync({ gym: draft.gyms[0] });
        onDone('Gimnasio creado.');
      }}
    />
  );
}

/** The superadmin's home: every client with its gyms and branches. */
export function PlatformPage({ onInspect }: { onInspect: (organizationId: string) => void }): ReactElement {
  const { logout } = useAuth();
  const createClient = useCreateClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [creating, setCreating] = useState(false);
  const [addingGym, setAddingGym] = useState<{ id: string; name: string } | null>(null);
  const [addingBranch, setAddingBranch] = useState<CatalogGym | null>(null);
  const [message, setMessage] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const term = useDebouncedValue(search.trim());
  const clients = useClients(term, page, pageSize);
  const summary = useClientSummary();

  function done(text: string): void {
    setAddingGym(null);
    setAddingBranch(null);
    setMessage(text);
  }

  const metrics = [
    { label: 'Clientes', value: summary.data?.clients },
    { label: 'Gimnasios', value: summary.data?.gyms },
    { label: 'Sedes', value: summary.data?.branches },
    { label: 'Usuarios de clientes', value: summary.data?.client_users },
  ];

  return (
    <div className="platform-shell">
      <header className="platform-header">
        <div className="platform-brand">
          <img src="/brand/atmosfera-mark.svg" width="36" height="36" alt="" />
          <strong>Atmósfera</strong>
          <span>Administración de Pulso</span>
        </div>
        <div className="platform-user">
          <span>Superadmin</span>
          <Button variant="ghost" onClick={() => setProfileOpen(true)}>
            Mi perfil
          </Button>
          <Button variant="secondary" onClick={logout}>
            Cerrar sesión
          </Button>
          {profileOpen && <ProfileDialog onClose={() => setProfileOpen(false)} />}
        </div>
      </header>
      <main>
        <div className="page-heading">
          <div>
            <div className="date-label">ADMINISTRACIÓN DE CLIENTES</div>
            <h1>Clientes y gimnasios</h1>
            <p>Gestiona las cuentas, los gimnasios y sus sedes.</p>
          </div>
          <Button onClick={() => setCreating(true)}>
            <Icon name="plus" size={17} /> Nuevo cliente
          </Button>
        </div>
        <div className="platform-metrics">
          {metrics.map((metric) => (
            <article className="card metric" key={metric.label}>
              <span className="muted">{metric.label}</span>
              <strong className="metric-value">{metric.value ?? '–'}</strong>
            </article>
          ))}
        </div>
        <div className="platform-toolbar">
          <div className="search-field">
            <Icon name="search" size={17} />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              aria-label="Buscar cliente, gimnasio o RUC"
              placeholder="Buscar cliente, gimnasio o RUC..."
            />
          </div>
          {message && <span role="status">{message}</span>}
        </div>
        {clients.isError && (
          <p className="error" role="alert">
            {describeError(clients.error)}
          </p>
        )}
        <div className="client-grid">
          {clients.data?.data.map((client) => (
            <article className="card client-card" key={client.id}>
              <div className="client-heading">
                <h2>{client.name}</h2>
                <div className="client-chips">
                  <span className={`badge ${client.owner.is_active ? 'active' : 'expired'}`}>{client.owner.is_active ? 'Activa' : 'Inactiva'}</span>
                </div>
              </div>
              <div className="client-gyms">
                {client.gyms.map((gym) => (
                  <section key={gym.id}>
                    <div>
                      <strong>{gymTitle(gym)}</strong>
                      <small>{gym.tax_id ? `RUC ${gym.tax_id}` : 'Sin RUC registrado'}</small>
                    </div>
                    <div className="client-branches">
                      {gym.branches.map((branch) => (
                        <span className="subtle-pill" key={branch.id}>
                          {branch.name}
                        </span>
                      ))}
                      <Button variant="ghost" aria-label={`Añadir sede a ${gymTitle(gym)}`} onClick={() => setAddingBranch(gym)}>
                        <Icon name="plus" size={14} /> Sede
                      </Button>
                    </div>
                  </section>
                ))}
              </div>
              <div className="client-actions">
                <Button
                  variant="secondary"
                  onClick={() => setAddingGym({ id: client.id, name: client.name })}
                >
                  <Icon name="plus" size={15} /> Añadir gimnasio
                </Button>
                <Button onClick={() => onInspect(client.id)} aria-label={`Consultar ${client.name}`}>
                  Consultar <Icon name="arrow" size={15} />
                </Button>
              </div>
            </article>
          ))}
          {clients.data?.data.length === 0 && <div className="empty">No se encontraron clientes con esta búsqueda.</div>}
          {clients.isPending && <div className="empty">Cargando…</div>}
        </div>
        {clients.data && clients.data.meta.total > PAGE_SIZES[0] && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={clients.data.meta.total}
            pageSizes={PAGE_SIZES}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
      </main>
      {creating && (
        <ClientForm
          onClose={() => setCreating(false)}
          onSave={async (draft) => {
            await createClient.mutateAsync({ draft });
            setCreating(false);
            setMessage(`Cliente creado. Ingresa con el DNI ${draft.contactDni}; su contraseña inicial es ese mismo DNI y la cambiará al entrar.`);
          }}
        />
      )}
      {addingGym && <AddGymForm clientId={addingGym.id} clientName={addingGym.name} onClose={() => setAddingGym(null)} onDone={done} />}
      {addingBranch && <AddBranchDialog gym={addingBranch} onClose={() => setAddingBranch(null)} onDone={done} />}
    </div>
  );
}
