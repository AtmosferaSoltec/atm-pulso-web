import type { ReactElement } from 'react';
import type { Gym } from '@/features/organization';
export function GymBrand({ gym, compact = false }: { gym: Gym; compact?: boolean }): ReactElement {
 const name = gym.displayName?.trim() || gym.name;
 return <span className={`gym-brand ${compact ? 'compact' : ''}`}>{gym.logoUrl ? <img src={gym.logoUrl} alt={`Logo de ${name}`} /> : <span className="gym-monogram" aria-hidden="true">{name.split(' ').map(word => word[0]).slice(0,2).join('')}</span>}<span className="gym-brand-name">{name}</span></span>;
}
