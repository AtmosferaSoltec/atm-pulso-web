import type { ReactElement } from 'react';

interface GymBrandProps {
  /** Visible name of the gym. */
  name: string;
  compact?: boolean;
}

/** The gym's name with its monogram (logos are not uploaded yet). */
export function GymBrand({ name, compact = false }: GymBrandProps): ReactElement {
  return (
    <span className={`gym-brand ${compact ? 'compact' : ''}`}>
      <span className="gym-monogram" aria-hidden="true">
        {name.split(' ').map((word) => word[0]).slice(0, 2).join('')}
      </span>
      <span className="gym-brand-name">{name}</span>
    </span>
  );
}
