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
import { AccessAlert, AccessPage, QuickAccessCheck, type AccessResult } from '@/features/access';
import { PaymentsPage } from '@/features/payments';
import { PlansPage } from '@/features/plans';
import { KioskPage } from '@/features/kiosk';
import { ProductsPage, QuickSalePage, SalesPage } from '@/features/sales';
import type { Page } from '@/types/navigation.types';
import type { Sale } from '@/types/api.types';
import { ProfileDialog } from '@/features/auth';
import { TeamPage } from '@/features/team';
import { brandTheme, brandFavicon } from '@/features/branding';
import { useCatalog, gymTitle } from '@/features/gym';

export function Workspace(): ReactElement {
  const user = useCurrentUser();
  const { logout, tenants, switchGym } = useAuth();
  const { gyms, branches, branchLabel } = useCatalog();
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
  const [renewingPlanId, setRenewingPlanId] = useState<string | undefined>();
  const [editing, setEditing] = useState<Member | null>(null);
  const [selected, setSelected] = useState<{ member: Member; receiptId?: string } | null>(null);
  const [toast, setToast] = useState('');
  const [accessAlert, setAccessAlert] = useState<AccessResult | null>(null);
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
    setRenewingPlanId(undefined);
  }

  function openEnrollment(member?: Member, planId?: string): void {
    setRenewing(member);
    setRenewingPlanId(planId);
    setSelected(null);
    setRegistering(true);
  }

  function saved(sale: Sale, voucherFailures: number): void {
    const renewal = !!renewing;
    closeEnrollment();
    setSelected({ member: sale.member, receiptId: sale.receipt.id });
    const done = renewal ? 'Renovación y pago registrados.' : 'Miembro y pago registrados.';
    setToast(voucherFailures > 0 ? `${done} No se pudo subir ${voucherFailures === 1 ? 'un comprobante' : `${voucherFailures} comprobantes`}: súbelos desde Pagos.` : done);
  }

  function changeBranch(id: string): void {
    if (!availableBranches.some((item) => item.id === id)) return;
    setBranchId(id);
    setSelected(null);
    setEditing(null);
    setAccessAlert(null);
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
        gyms={tenants}
        onGymChange={switchGym}
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
        <Topbar locationLabel={branchLabel(branch.id)} userName={user.full_name} onToggleMenu={() => setMobileOpen(!mobileOpen)}>
          <QuickAccessCheck branchId={branch.id} hidden={page === 'access'} onResult={setAccessAlert} />
        </Topbar>
        <main>
          <div className="page-heading">
            <h1>{pageDetails[page].title}</h1>
            {enrollmentPages.includes(page) && (
              <Button onClick={() => openEnrollment()}>
                <Icon name="plus" size={18} /> Nuevo miembro
              </Button>
            )}
          </div>
          {page === 'dashboard' && (
            <Dashboard
              branchId={branch.id}
              onSelect={(member) => setSelected({ member })}
              onEdit={setEditing}
              onRenew={openEnrollment}
            />
          )}
          {page === 'members' && (
            <MembersPage
              filters={filters}
              showBranch={hasManyBranches}
              onSelect={(member) => setSelected({ member })}
              onEdit={setEditing}
              onRenew={openEnrollment}
            />
          )}
          {page === 'access' && (
            <AccessPage key={branch.id} branchId={branch.id} branchName={branchLabel(branch.id)} dayPassPrice={branch.dayPassPrice} />
          )}
          {page === 'payments' && <PaymentsPage key={branch.id} branchId={branch.id} showSummary={user.role !== 'receptionist'} />}
          {page === 'team' && <TeamPage />}
          {page === 'plans' && <PlansPage key={gym.id} gym={gym} />}
          {page === 'kiosk' && <KioskPage />}
          {page === 'sell' && <QuickSalePage key={branch.id} branchId={branch.id} onDone={setToast} />}
          {page === 'sales' && <SalesPage branchId={branch.id} showReport={user.role === 'admin'} onDone={setToast} />}
          {page === 'products' && <ProductsPage />}
        </main>
      </div>
      {registering && <MemberForm member={renewing} planId={renewingPlanId} branchId={branch.id} onSaved={saved} onClose={closeEnrollment} />}
      {selected && (
        <MemberSheet
          member={selected.member}
          receiptId={selected.receiptId}
          branchId={branch.id}
          onNotify={setToast}
          onClose={() => setSelected(null)}
          onRenew={openEnrollment}
          onEdit={(member) => {
            setSelected(null);
            setEditing(member);
          }}
        />
      )}
      {editing && (
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
      {accessAlert && page !== 'access' && <AccessAlert result={accessAlert} branchName={branchLabel(branch.id)} onClose={() => setAccessAlert(null)} />}
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
