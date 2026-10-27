import type { ReactElement } from 'react';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';

interface TopbarProps {
  locationLabel: string;
  userName: string;
  onToggleMenu: () => void;
  onBack?: () => void;
}

export function Topbar({
  locationLabel,
  userName,
  onToggleMenu,
  onBack,
}: TopbarProps): ReactElement {
  return (
    <header className="topbar">
      <IconButton icon="menu" label="Abrir menú" className="mobile-menu" onClick={onToggleMenu} />
      <div className="topbar-actions">
        {onBack && (
          <Button variant="secondary" onClick={onBack}>
            Volver a clientes
          </Button>
        )}
        <span className="location-label">{locationLabel}</span>
        <span className="topbar-avatar">{userName.split(' ').map((part) => part[0]).join('')}</span>
      </div>
    </header>
  );
}
