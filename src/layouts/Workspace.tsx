import { useEffect, useState, type ReactElement } from 'react';
import { Sidebar } from '@/components/common/Sidebar';
import { Topbar } from '@/components/common/Topbar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { enrollmentPages, pageDetails } from '@/config/pages';
import { documentTitle, DEFAULT_TITLE } from '@/config/documentTitle';
import { usePageRoute } from '@/hooks/usePageRoute';
import { useAuth, useCurrentUser } from '@/store/authStore';
import { Dashboard } from '@/features/dashboard';
import { useMemberFilters, MembersPage, MemberForm, MemberPage, MemberEditForm, type Member, type MemberListFilter } from '@/features/members';
import { AccessAlert, AccessPage, QuickAccessCheck, type AccessResult } from '@/features/access';
import { PaymentsPage } from '@/features/payments';
import { PlansPage } from '@/features/plans';
import { KioskPage } from '@/features/kiosk';
import { ProductsPage, QuickSalePage, SalesPage } from '@/features/sales';
import type { Page } from '@/types/navigation.types';
import type { Sale } from '@/types/api.types';
import { ProfileDialog } from '@/features/auth';
import { TeamPage } from '@/features/team';
import { brandTheme } from '@/features/branding';
import { useCatalog, gymTitle } from '@/features/gym';

export function Workspace(): ReactElement {
  const user = useCurrentUser();
  const { logout, tenants, switchGym } = useAuth();
  const { gyms, branches, branchLabel } = useCatalog();
  const { page, memberId, goTo, openMember } = usePageRoute(user);

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
  /** The receipt just issued: the member's page opens with it on screen. */
  const [issued, setIssued] = useState<{ memberId: string; receiptId: string } | null>(null);
  const [toast, setToast] = useState('');
  const [accessAlert, setAccessAlert] = useState<AccessResult | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const brandName = gym ? gymTitle(gym) : 'Pulso';
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  // The tab is always Pulso's (title and favicon), whatever the gym: the gym's branding lives inside the app.
  useEffect(() => {
    document.title = documentTitle(pageDetails[page].name);
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [page]);

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

  /** Opens a member's page from a list (the receipt just issued is only for the page right after a sale). */
  function viewMember(id: string): void {
    setIssued(null);
    openMember(id);
  }

  function navigate(next: Page, status: MemberListFilter = 'all'): void {
    setIssued(null);
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
    setRegistering(true);
  }

  function saved(sale: Sale, voucherFailures: number): void {
    const renewal = !!renewing;
    closeEnrollment();
    setIssued({ memberId: sale.member.id, receiptId: sale.receipt.id });
    openMember(sale.member.id);
    const done = renewal ? 'Renovación y pago registrados.' : 'Miembro y pago registrados.';
    setToast(voucherFailures > 0 ? `${done} No se pudo subir ${voucherFailures === 1 ? 'un comprobante' : `${voucherFailures} comprobantes`}: súbelos desde Pagos.` : done);
  }

  function changeBranch(id: string): void {
    if (!availableBranches.some((item) => item.id === id)) return;
    setBranchId(id);
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
        <Topbar locationLabel={hasManyBranches ? branchLabel(branch.id) : brandName} userName={user.full_name} onToggleMenu={() => setMobileOpen(!mobileOpen)}>
          <QuickAccessCheck branchId={branch.id} hidden={page === 'access'} onResult={setAccessAlert} />
        </Topbar>
        <main>
          {!(page === 'members' && memberId) && (
          <div className="page-heading">
            <h1>{pageDetails[page].title}</h1>
            {enrollmentPages.includes(page) && (
              <Button onClick={() => openEnrollment()}>
                <Icon name="plus" size={18} /> Nuevo miembro
              </Button>
            )}
          </div>
          )}
          {page === 'dashboard' && (
            <Dashboard
              branchId={branch.id}
              onSelect={(member) => viewMember(member.id)}
              onEdit={setEditing}
              onRenew={openEnrollment}
            />
          )}
          {page === 'members' && memberId && (
            <MemberPage
              key={`${memberId}:${issued?.memberId === memberId ? issued.receiptId : ''}`}
              memberId={memberId}
              branchId={branch.id}
              receiptId={issued?.memberId === memberId ? issued.receiptId : undefined}
              onBack={() => {
                setIssued(null);
                goTo('members');
              }}
              onEdit={setEditing}
              onRenew={openEnrollment}
              onNotify={setToast}
            />
          )}
          {page === 'members' && !memberId && (
            <MembersPage
              filters={filters}
              showBranch={hasManyBranches}
              canDownload={user.role === 'admin'}
              onOpen={viewMember}
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
      {editing && (
        <MemberEditForm
          member={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
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
