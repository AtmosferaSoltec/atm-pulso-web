import { useState, type ReactElement } from 'react';
import type { Branch } from '@/features/organization/types/organization.types';
import { useOrganizationCatalog } from '@/features/organization/hooks/useOrganizationCatalog';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
export function BranchSwitcher({ branches, activeBranchId, onChange }: { branches: Branch[]; activeBranchId: string; onChange: (id: string) => void }): ReactElement {
 const { gyms } = useOrganizationCatalog();
 const [open, setOpen] = useState(false); const active = branches.find(branch => branch.id === activeBranchId)!; const gym = gyms.find(item => item.id === active.gymId)!;
 return <><Button variant="secondary" className="workspace branch-trigger" aria-label={branches.length > 1 ? 'Cambiar sede' : 'Información de sede'} onClick={() => setOpen(true)}><span className="workspace-icon"><Icon name="dashboard" size={19} /></span><span><strong>{gym.name}</strong><small>{active.name}</small></span><Icon name="chevron" size={14} /></Button>{open && <Dialog title={branches.length > 1 ? 'Cambiar sede de trabajo' : 'Información de sede'} onClose={() => setOpen(false)}><p className="muted">{branches.length > 1 ? 'Los pagos y los ingresos se registran en la sede seleccionada.' : 'Tu cuenta trabaja con una única sede.'}</p><div className="branch-options">{branches.map(branch => { const branchGym = gyms.find(item => item.id === branch.gymId)!; return <Button key={branch.id} variant="secondary" className="branch-option" aria-pressed={branch.id === activeBranchId} onClick={() => { onChange(branch.id); setOpen(false); }}><span><strong>{branchGym.name} · {branch.name}</strong><small>RUC {branchGym.taxId} · {branch.address}</small></span>{branch.id === activeBranchId && <Icon name="check" size={18} />}</Button>; })}</div></Dialog>}</>;
}
