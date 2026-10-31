import { useState, type ReactElement } from 'react';
import type { BranchOption } from '@/features/organization/types/organization.types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';

interface BranchSwitcherProps {
  branches: BranchOption[];
  activeBranchId: string;
  onChange: (id: string) => void;
}

export function BranchSwitcher({ branches, activeBranchId, onChange }: BranchSwitcherProps): ReactElement {
  const [open, setOpen] = useState(false);
  const active = branches.find((branch) => branch.id === activeBranchId) ?? branches[0];
  return (
    <>
      <Button variant="secondary" className="workspace branch-trigger" aria-label={branches.length > 1 ? 'Cambiar sede' : 'Información de sede'} onClick={() => setOpen(true)}>
        <span className="workspace-icon">
          <Icon name="dashboard" size={19} />
        </span>
        <span>
          <strong>{active.gymName}</strong>
          <small>{active.name}</small>
        </span>
        <Icon name="chevron" size={14} />
      </Button>
      {open && (
        <Dialog title={branches.length > 1 ? 'Cambiar sede de trabajo' : 'Información de sede'} onClose={() => setOpen(false)}>
          <p className="muted">{branches.length > 1 ? 'Los pagos y los ingresos se registran en la sede seleccionada.' : 'Tu cuenta trabaja con una única sede.'}</p>
          <div className="branch-options">
            {branches.map((branch) => (
              <Button
                key={branch.id}
                variant="secondary"
                className="branch-option"
                aria-pressed={branch.id === activeBranchId}
                onClick={() => {
                  onChange(branch.id);
                  setOpen(false);
                }}
              >
                <span>
                  <strong>
                    {branch.gymName} · {branch.name}
                  </strong>
                  <small>{[branch.taxId && `RUC ${branch.taxId}`, branch.address].filter(Boolean).join(' · ')}</small>
                </span>
                {branch.id === activeBranchId && <Icon name="check" size={18} />}
              </Button>
            ))}
          </div>
        </Dialog>
      )}
    </>
  );
}
