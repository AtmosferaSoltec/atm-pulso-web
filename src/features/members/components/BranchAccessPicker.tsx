import type { ReactElement } from 'react';
import { Input } from '@/components/ui/input';

interface BranchChoice {
  id: string;
  label: string;
}

interface BranchAccessPickerProps {
  branches: BranchChoice[];
  selectedIds: string[];
  /** The enrollment branch: it always has access and cannot be unchecked. */
  lockedId: string;
  onChange: (ids: string[]) => void;
}

/** A checklist of the branches a membership opens; everything starts checked. */
export function BranchAccessPicker({ branches, selectedIds, lockedId, onChange }: BranchAccessPickerProps): ReactElement {
  function toggle(id: string): void {
    onChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  }
  return (
    <>
      <fieldset className="branch-checklist">
        <legend className="visually-hidden">Sedes con acceso</legend>
        {branches.map((branch) => {
          const locked = branch.id === lockedId;
          return (
            <label key={branch.id}>
              <Input type="checkbox" checked={selectedIds.includes(branch.id)} disabled={locked} onChange={() => toggle(branch.id)} />
              <span>{branch.label}</span>
              {locked && <small>Sede de inscripción</small>}
            </label>
          );
        })}
      </fieldset>
      <small className="branch-picker-note">
        {selectedIds.length} de {branches.length} sedes con acceso
      </small>
    </>
  );
}
