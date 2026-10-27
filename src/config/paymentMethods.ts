import type { Option } from '@/components/ui/option-cards';
import type { PaymentMethod } from '@/types/api.types';

export const paymentMethodOptions: Option<PaymentMethod>[] = [
  { value: 'yape_plin', label: 'Yape/Plin', icon: 'phone' },
  { value: 'cash', label: 'Efectivo', icon: 'cash' },
  { value: 'card', label: 'Tarjeta', icon: 'plans' },
  { value: 'transfer', label: 'Transferencia', icon: 'bank' },
];

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  yape_plin: 'Yape/Plin',
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
};
