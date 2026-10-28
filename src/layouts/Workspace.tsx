import { useEffect, useState, type ReactElement } from 'react';
import { Sidebar } from '@/components/common/Sidebar';
import { Topbar } from '@/components/common/Topbar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { enrollmentPages, pageDetails } from '@/config/pages';
import { usePageRoute } from '@/hooks/usePageRoute';
import { useAuth, useCurrentUser } from '@/store/authStore';
import { Dashboard } from '@/features/dashboard';
import { useMemberFilters, MembersPage, MemberForm, MemberSheet, MemberEditForm, type Member, type StatusFilter } from '@/features/members';
import { AccessPage } from '@/features/access';
import { PaymentsPage } from '@/features/payments';
import { PricingPage } from '@/features/pricing';
import type { Page } from '@/types/navigation.types';
import type { Sale } from '@/types/api.types';
import { ProfileDialog } from '@/features/auth';
import { TeamPage } from '@/features/team';
import { BrandingPage, brandTheme, brandFavicon } from '@/features/branding';
import { useCatalog, gymTitle } from '@/features/organization';

interface WorkspaceProps {
  /** Present when the superadmin is looking at a client: goes back to the client list. */
  onBack?: () => void;
}

export function Workspace({ onBack }: WorkspaceProps): ReactElement {
  const user = useCurrentUser();
  const { logout } = useAuth();
  const { gyms, branches, branchLabel } = useCatalog();
  const readOnly = user.role === 'superadmin';
  const { page, goTo } = usePageRoute(user);

  const availableBranches = branches.filter((branch) => branch.accessible);
  const [branchId, setBranchId] = useState(availableBranches[0]?.id ?? '');
  const branch = availableBranches.find((item) => item.id === branchId) ?? availableBranches[0];
  const gym = gyms.find((item) => item.id === branch?.gymId);

  const hasManyBranches = branches.length > 1;
  const filters = useMemberFilters();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [renewing, setRenewing] = useState<Member | undefined>();
  const [editing, setEditing] = useState<Member | null>(null);
  const [selected, setSelected] = useState<{ member: Member; receiptId?: string } | null>(null);
  const [toast, setToast] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  const brandName = gym ? gymTitle(gym) : 'Pulso';
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    document.title = `${brandName} · ${pageDetails[page].name}`;
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (icon && gym) icon.href = brandFavicon(brandName, gym.brand_color);
    return () => {
      document.title = 'Pulso · Administración de gimnasios';
      if (icon) icon.href = '/favicon.svg';
    };
  }, [brandName, gym, page]);

  if (!branch || !gym) {
    return (
      <div className="state-block" role="alert">
        <p className="error">Tu usuario no tiene sedes asignadas. Pide a tu administrador que te asigne una.</p>
        <Button variant="secondary" onClick={logout}>
          Cerrar sesión
        </Button>
      </div>
    );
  }

  function navigate(next: Page, status: StatusFilter = 'all'): void {
    goTo(next);
    setMobileOpen(false);
    filters.reset(status);
  }

  function closeEnrollment(): void {
    setRegistering(false);
    setRenewing(undefined);
  }

  function openEnrollment(member?: Member): void {
    if (readOnly) return;
    setRenewing(member);
    setSelected(null);
    setRegistering(true);
  }

  function saved(sale: Sale): void {
    const renewal = !!renewing;
    closeEnrollment();
    setSelected({ member: sale.member, receiptId: sale.receipt.id });
    setToast(renewal ? 'Renovación y pago registrados.' : 'Miembro y pago registrados.');
  }

  function changeBranch(id: string): void {
    if (!availableBranches.some((item) => item.id === id)) return;
    setBranchId(id);
    setSelected(null);
    setEditing(null);
    closeEnrollment();
    filters.reset();
    setMobileOpen(false);
    setToast(`Sede de trabajo: ${branchLabel(id)}`);
  }

  return (
    <div className="app-shell tenant-theme" style={brandTheme(gym.brand_color)}>
      <Sidebar
        page={page}
        onNavigate={navigate}
        open={mobileOpen}
        user={user}
        branches={availableBranches}
        branchId={branch.id}
        onBranchChange={changeBranch}
        onLogout={logout}
        onOpenProfile={() => {
          setProfileOpen(true);
          setMobileOpen(false);
        }}
        gymName={brandName}
        gymLogoUrl={gym.logo_url}
      />
      {mobileOpen && <Button className="sidebar-backdrop" variant="ghost" aria-label="Cerrar menú" onClick={() => setMobileOpen(false)} />}
      <div className="main-shell">
        <Topbar locationLabel={branchLabel(branch.id)} userName={user.full_name} onToggleMenu={() => setMobileOpen(!mobileOpen)} onBack={onBack} />
        <main>
          <div className="page-heading">
            <h1>{pageDetails[page].title}</h1>
            {!readOnly && enrollmentPages.includes(page) && (
              <Button onClick={() => openEnrollment()}>
                <Icon name="plus" size={18} /> Nuevo miembro
              </Button>
            )}
          </div>
          {page === 'dashboard' && (
            <Dashboard
              branchId={branch.id}
              readOnly={readOnly}
              onSelect={(member) => setSelected({ member })}
              onEdit={setEditing}
              onRenew={openEnrollment}
            />
          )}
          {page === 'members' && (
            <MembersPage
              filters={filters}
              showBranch={hasManyBranches}
              readOnly={readOnly}
              localOnly={hasManyBranches ? { branchId: branch.id, branchName: branch.name } : undefined}
              onSelect={(member) => setSelected({ member })}
              onEdit={setEditing}
              onRenew={openEnrollment}
            />
          )}
          {page === 'access' && (
            <AccessPage key={branch.id} branchId={branch.id} branchName={branchLabel(branch.id)} dayPassPrice={branch.dayPassPrice} readOnly={readOnly} />
          )}
          {page === 'payments' && <PaymentsPage key={branch.id} branchId={branch.id} showSummary={user.role !== 'receptionist'} />}
          {page === 'team' && <TeamPage readOnly={readOnly} />}
          {page === 'pricing' && <PricingPage key={gym.id} gym={gym} readOnly={readOnly} />}
          {page === 'branding' && <BrandingPage key={gym.id} gym={gym} />}
        </main>
      </div>
      {registering && !readOnly && <MemberForm member={renewing} branchId={branch.id} onSaved={saved} onClose={closeEnrollment} />}
      {selected && (
        <MemberSheet
          member={selected.member}
          receiptId={selected.receiptId}
          readOnly={readOnly}
          onClose={() => setSelected(null)}
          onRenew={openEnrollment}
          onEdit={(member) => {
            setSelected(null);
            setEditing(member);
          }}
        />
      )}
      {editing && !readOnly && (
        <MemberEditForm
          member={editing}
          onClose={() => setEditing(null)}
          onSaved={(member) => {
            setEditing(null);
            setSelected({ member });
            setToast('Datos del miembro actualizados.');
          }}
        />
      )}
      {profileOpen && <ProfileDialog onClose={() => setProfileOpen(false)} />}
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
