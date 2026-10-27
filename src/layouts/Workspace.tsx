import { useEffect, useState, type ReactElement } from 'react';
import { Sidebar } from '@/components/common/Sidebar';
import { Topbar } from '@/components/common/Topbar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { enrollmentPages, pageDetails } from '@/config/pages';
import { usePageRoute } from '@/hooks/usePageRoute';
import { Dashboard } from '@/features/dashboard';
import {
  useMembers,
  useMemberFilters,
  MembersPage,
  MemberForm,
  MemberSheet,
  MemberEditForm,
  directoryMembers,
  memberStatus,
  type Member,
  type StatusFilter,
} from '@/features/members';
import { AccessPage, useAccess } from '@/features/access';
import { PaymentsPage, usePayments } from '@/features/payments';
import type { Page } from '@/types/navigation.types';
import { canManageAccount, type DemoUser } from '@/features/auth';
import { useDemoStore } from '@/store/demoStore';
import { TeamPage } from '@/features/team';
import { BrandingPage, brandTheme, brandFavicon } from '@/features/branding';
import { useOrganizationCatalog, OrganizationPage } from '@/features/organization';

const DEFAULT_BRAND_COLOR = '#17677b';

interface WorkspaceProps {
  user: DemoUser;
  organizationId?: string;
  onLogout: () => void;
  onBack?: () => void;
}

export function Workspace({ user, organizationId = user.organizationId, onLogout, onBack }: WorkspaceProps): ReactElement {
  const { organizations, gyms, branches: allBranches, organizationBranches, branchLabel } = useOrganizationCatalog();
  const { setState } = useDemoStore();
  const readOnly = user.role === 'superadmin';
  const { page, goTo } = usePageRoute(user);

  const organization = organizations.find((item) => item.id === organizationId)!;
  const availableBranches = organizationBranches(organizationId).filter(
    (branch) => user.role !== 'receptionist' || user.branchIds.includes(branch.id),
  );
  const [branchId, setBranchId] = useState(availableBranches[0].id);
  const branch = availableBranches.find((item) => item.id === branchId)!;
  const gym = gyms.find((item) => item.id === branch.gymId)!;

  const { members, saveMember, updateMember } = useMembers(organizationId);
  const { paymentRecords, recordPayment } = usePayments(organizationId);
  const { entries, checkAccess } = useAccess();

  const [localOnly, setLocalOnly] = useState(false);
  const directory = readOnly ? members : directoryMembers(members, organization, branchId);
  const displayedMembers = localOnly ? directory.filter((member) => member.homeBranchId === branchId) : directory;
  const localMembers = members.filter((member) => member.homeBranchId === branchId);
  const localPayments = paymentRecords.filter((record) => (record.paymentBranchId ?? record.homeBranchId) === branchId);
  const localEntries = entries.filter((entry) => entry.branchId === branchId);
  const filters = useMemberFilters(displayedMembers);
  const hasExpiring = localMembers.some((member) => memberStatus(member) === 'expiring');

  const [mobileOpen, setMobileOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [renewing, setRenewing] = useState<Member | undefined>();
  const [editing, setEditing] = useState<Member | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const selected = directory.find((member) => member.id === selectedId);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    document.title = `${gym.displayName || gym.name} · ${pageDetails[page].name}`;
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (icon) icon.href = gym.logoUrl || brandFavicon(gym.displayName || gym.name, gym.brandColor ?? DEFAULT_BRAND_COLOR);
    return () => {
      document.title = 'Pulso · Administración de gimnasios';
      if (icon) icon.href = '/favicon.svg';
    };
  }, [gym.displayName, gym.name, gym.logoUrl, gym.brandColor, page]);

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
    setSelectedId(null);
    setRegistering(true);
  }

  function save(member: Member): void {
    if (readOnly) return;
    saveMember(member);
    recordPayment(member, branchId);
    closeEnrollment();
    setSelectedId(member.id);
    setToast(renewing ? 'Renovación y pago registrados.' : 'Miembro y pago registrados.');
  }

  function changeBranch(id: string): void {
    if (!availableBranches.some((item) => item.id === id)) return;
    setBranchId(id);
    setSelectedId(null);
    setEditing(null);
    closeEnrollment();
    filters.reset();
    setLocalOnly(false);
    setMobileOpen(false);
    setToast(`Sede de trabajo: ${branchLabel(id)}`);
  }

  function saveRules(value: typeof organization): void {
    if (!canManageAccount(user, organizationId)) return;
    setState((current) => ({
      ...current,
      organizations: current.organizations.map((item) => (item.id === value.id ? value : item)),
    }));
    setSelectedId(null);
    setToast('Reglas actualizadas para esta cuenta.');
  }

  const sheetGym =
    selected && gyms.find((item) => item.id === allBranches.find((location) => location.id === selected.homeBranchId)?.gymId);

  return (
    <div className="app-shell tenant-theme" style={brandTheme(gym.brandColor ?? DEFAULT_BRAND_COLOR)}>
      <Sidebar
        page={page}
        onNavigate={navigate}
        open={mobileOpen}
        user={user}
        branches={availableBranches}
        branchId={branchId}
        onBranchChange={changeBranch}
        onLogout={onLogout}
        gym={gym}
      />
      {mobileOpen && <Button className="sidebar-backdrop" variant="ghost" aria-label="Cerrar menú" onClick={() => setMobileOpen(false)} />}
      <div className="main-shell">
        <Topbar
          locationLabel={branchLabel(branchId)}
          userName={user.name}
          hasAlerts={hasExpiring}
          onToggleMenu={() => setMobileOpen(!mobileOpen)}
          onAlertsClick={() => navigate('members', 'expiring')}
          onBack={onBack}
        />
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
              members={localMembers}
              payments={localPayments}
              readOnly={readOnly}
              onNavigate={navigate}
              onExpiring={() => navigate('members', 'expiring')}
              onSelect={(member) => setSelectedId(member.id)}
              onEdit={setEditing}
              onRenew={openEnrollment}
            />
          )}
          {page === 'members' && (
            <MembersPage
              filters={filters}
              showBranch={organization.shareDirectory || readOnly}
              readOnly={readOnly}
              localOnly={
                organization.shareDirectory
                  ? { active: localOnly, branchName: branch.name, onToggle: () => setLocalOnly(!localOnly) }
                  : undefined
              }
              onSelect={(member) => setSelectedId(member.id)}
              onEdit={setEditing}
              onRenew={openEnrollment}
            />
          )}
          {page === 'access' && (
            <AccessPage
              key={branchId}
              entries={localEntries}
              readOnly={readOnly}
              onCheck={(dni) => checkAccess(dni, members, branchId, organization)}
            />
          )}
          {page === 'payments' && (
            <PaymentsPage members={localPayments} showSummary={user.role !== 'receptionist'} />
          )}
          {page === 'organization' && (
            <OrganizationPage key={organization.id} organization={organization} readOnly={readOnly} onSave={saveRules} />
          )}
          {page === 'team' && <TeamPage organizationId={organizationId} readOnly={readOnly} />}
          {page === 'branding' && <BrandingPage key={gym.id} gym={gym} readOnly={readOnly} />}
        </main>
      </div>
      {registering && !readOnly && (
        <MemberForm members={members} member={renewing} organization={organization} branchId={branchId} onSave={save} onClose={closeEnrollment} />
      )}
      {selected && (
        <MemberSheet
          member={selected}
          readOnly={readOnly}
          gym={sheetGym ?? gym}
          onClose={() => setSelectedId(null)}
          onRenew={(id) => openEnrollment(members.find((member) => member.id === id))}
          onEdit={(member) => {
            setSelectedId(null);
            setEditing(member);
          }}
        />
      )}
      {editing && !readOnly && (
        <MemberEditForm
          member={editing}
          onClose={() => setEditing(null)}
          onSave={(member) => {
            updateMember(member);
            setEditing(null);
            setSelectedId(member.id);
            setToast('Datos del miembro actualizados.');
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
