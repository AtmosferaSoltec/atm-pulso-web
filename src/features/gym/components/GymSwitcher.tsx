import { useState, type ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import type { SessionTenant } from '@/features/auth/types/auth.types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';

interface GymSwitcherProps {
  /** The gyms the person works for; the switcher renders nothing with fewer than two. */
  gyms: SessionTenant[];
  onChange: (tenantId: string) => Promise<void>;
}

/** Changes the gym the whole session works in (an atm-auth-api company). Only for people who work for several. */
export function GymSwitcher({ gyms, onChange }: GymSwitcherProps): ReactElement | null {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (gyms.length < 2) return null;

  async function choose(tenantId: string): Promise<void> {
    setBusy(true);
    try {
      await onChange(tenantId);
      setOpen(false);
    } catch (failure) {
      setError(describeError(failure));
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="secondary" className="workspace branch-trigger" aria-label="Cambiar de gimnasio" onClick={() => setOpen(true)}>
        <span className="workspace-icon">
          <Icon name="members" size={19} />
        </span>
        <span>
          <strong>Cambiar de gimnasio</strong>
          <small>{gyms.length} gimnasios</small>
        </span>
        <Icon name="chevron" size={14} />
      </Button>
      {open && (
        <Dialog title="Cambiar de gimnasio" onClose={() => setOpen(false)}>
          <div className="branch-options">
            {gyms.map((gym) => (
              <Button key={gym.tenantId} variant="secondary" className="branch-option" aria-pressed={gym.current} disabled={busy} onClick={() => void (gym.current ? setOpen(false) : choose(gym.tenantId))}>
                <span>
                  <strong>{gym.name}</strong>
                  <small>RUC {gym.ruc}</small>
                </span>
                {gym.current && <Icon name="check" size={18} />}
              </Button>
            ))}
          </div>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </Dialog>
      )}
    </>
  );
}
