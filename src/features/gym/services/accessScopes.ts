import type { Option } from '@/components/ui/option-cards';
import type { AccessScope } from '@/features/gym/types/gym.types';

export const accessScopeOptions: Option<AccessScope>[] = [
  { value: 'branch', label: 'Solo sede de inscripción', icon: 'pin' },
  { value: 'gym', label: 'Sedes del mismo gimnasio', icon: 'building' },
];
