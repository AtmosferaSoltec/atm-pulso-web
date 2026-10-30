import type { ReactElement, ReactNode } from 'react';
import { IconButton } from '@/components/ui/icon-button';

interface TopbarProps {
  locationLabel: string;
  userName: string;
  onToggleMenu: () => void;
  /** Extra controls placed before the location (the quick access check). */
  children?: ReactNode;
}

export function Topbar({
  locationLabel,
  userName,
  onToggleMenu,
  children,
}: TopbarProps): ReactElement {
  return (
    <header className="topbar">
      <IconButton icon="menu" label="Abrir menú" className="mobile-menu" onClick={onToggleMenu} />
      <div className="topbar-actions">
        {children}
        <span className="location-label">{locationLabel}</span>
        <span className="topbar-avatar">{userName.split(' ').map((part) => part[0]).join('')}</span>
      </div>
    </header>
  );
}
