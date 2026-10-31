import { useState, type ReactElement } from 'react';
import { BranchSwitcher, GymSwitcher, type BranchOption } from '@/features/gym';
import type { SessionTenant } from '@/features/auth/types/auth.types';
import { canVisitPage } from '@/features/auth';
import type { Role, SessionUser } from '@/types/api.types';
import { GymBrand } from '@/features/branding';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Icon } from '@/components/ui/icon';
import { mainPages, pageDetails, settingsPages } from '@/config/pages';
import type { Page } from '@/types/navigation.types';

interface SidebarProps {
  page: Page;
  onNavigate: (page: Page) => void;
  open: boolean;
  user: SessionUser;
  /** The gyms the person works for; a selector shows when there is more than one. */
  gyms: SessionTenant[];
  onGymChange: (tenantId: string) => Promise<void>;
  branches: BranchOption[];
  branchId: string;
  onBranchChange: (id: string) => void;
  onLogout: () => void;
  onOpenProfile: () => void;
  /** Visible name of the gym being worked in. */
  gymName: string;
  gymLogoUrl?: string | null;
}

const roleLabels: Record<Role, string> = {
  admin: 'Administrador',
  receptionist: 'Recepción',
};

export function Sidebar({
  page,
  onNavigate,
  open,
  user,
  gyms,
  onGymChange,
  branches,
  branchId,
  onBranchChange,
  onLogout,
  onOpenProfile,
  gymName,
  gymLogoUrl,
}: SidebarProps): ReactElement {
  const isReceptionist = user.role === 'receptionist';
  const home: Page = isReceptionist ? 'access' : 'dashboard';
  const visibleMain = mainPages.filter((id) => canVisitPage(user, id));
  const visibleSettings = settingsPages.filter((id) => canVisitPage(user, id));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const showSettings = settingsOpen || settingsPages.includes(page);

  function renderLink(id: Page): ReactElement {
    const label = isReceptionist && id === 'payments' ? 'Pagos' : pageDetails[id].name;
    return (
      <Button
        key={id}
        variant="ghost"
        className={`nav-link ${page === id ? 'selected' : ''}`}
        onClick={() => onNavigate(id)}
        aria-current={page === id ? 'page' : undefined}
      >
        <Icon name={pageDetails[id].icon} size={20} />
        <span>{label}</span>
      </Button>
    );
  }

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <a className="tenant-brand-link" href={`#${home}`} onClick={() => onNavigate(home)}>
        <GymBrand name={gymName} logoUrl={gymLogoUrl} />
      </a>
      <GymSwitcher gyms={gyms} onChange={onGymChange} />
      <BranchSwitcher branches={branches} activeBranchId={branchId} onChange={onBranchChange} />
      <nav aria-label="Navegación principal">
        {visibleMain.map(renderLink)}
        {visibleSettings.length > 0 && (
          <>
            <Button
              variant="ghost"
              className="nav-link settings-toggle"
              aria-expanded={showSettings}
              onClick={() => setSettingsOpen(!showSettings)}
            >
              <Icon name="settings" size={20} />
              <span>Configuración</span>
            </Button>
            {showSettings && <div className="settings-links">{visibleSettings.map(renderLink)}</div>}
          </>
        )}
      </nav>
      <div className="sidebar-bottom">
        <div className="profile">
          <button type="button" className="profile-button" aria-label="Mi perfil" title="Mi perfil" onClick={onOpenProfile}>
            <span className="profile-avatar">{user.full_name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
            <span className="profile-text">
              <strong>{user.full_name}</strong>
              <small>{roleLabels[user.role]}</small>
            </span>
          </button>
          <IconButton icon="logout" label="Cerrar sesión" className="logout-icon" onClick={onLogout} />
        </div>
      </div>
    </aside>
  );
}
