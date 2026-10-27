import { useState, type ReactElement } from 'react';
import { BranchSwitcher, type Branch, type Gym } from '@/features/organization';
import { canVisitPage, type DemoUser } from '@/features/auth';
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
  user: DemoUser;
  branches: Branch[];
  branchId: string;
  onBranchChange: (id: string) => void;
  onLogout: () => void;
  onOpenProfile: () => void;
  gym: Gym;
}

const roleLabels: Record<DemoUser['role'], string> = {
  superadmin: 'Superadmin',
  owner: 'Propietario',
  admin: 'Administrador',
  receptionist: 'Recepción',
};

export function Sidebar({
  page,
  onNavigate,
  open,
  user,
  branches,
  branchId,
  onBranchChange,
  onLogout,
  onOpenProfile,
  gym,
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
        <GymBrand gym={gym} />
      </a>
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
            <span className="profile-avatar">{user.name.split(' ').map((part) => part[0]).join('')}</span>
            <span className="profile-text">
              <strong>{user.name}</strong>
              <small>{roleLabels[user.role]}</small>
            </span>
          </button>
          <IconButton icon="logout" label="Cerrar sesión" className="logout-icon" onClick={onLogout} />
        </div>
      </div>
    </aside>
  );
}
