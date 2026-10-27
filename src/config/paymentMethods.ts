import type { Option } from '@/components/ui/option-cards';

export const paymentMethodOptions: Option<string>[] = [
  { value: 'Yape', label: 'Yape', icon: 'phone' },
  { value: 'Plin', label: 'Plin', icon: 'phone' },
  { value: 'Efectivo', label: 'Efectivo', icon: 'cash' },
  { value: 'Tarjeta', label: 'Tarjeta', icon: 'plans' },
  { value: 'Transferencia', label: 'Transferencia', icon: 'bank' },
];
