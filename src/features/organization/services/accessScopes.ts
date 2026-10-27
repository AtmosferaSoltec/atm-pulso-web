import type { Option } from '@/components/ui/option-cards';
import type { AccessScope } from '@/features/organization/types/organization.types';

export const accessScopeOptions: Option<AccessScope>[] = [
  { value: 'branch', label: 'Solo sede de inscripción', icon: 'pin' },
  { value: 'gym', label: 'Sedes del mismo gimnasio', icon: 'building' },
  { value: 'network', label: 'Toda la red del propietario', icon: 'network' },
];
