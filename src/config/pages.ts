import type { IconName } from '@/components/ui/icon';
import type { GymFeature } from '@/types/api.types';
import type { Page } from '@/types/navigation.types';

export interface PageDetails {
  /** Heading shown at the top of the page. */
  title: string;
  /** Short name used in the sidebar and the browser tab. */
  name: string;
  icon: IconName;
}

export const pageDetails: Record<Page, PageDetails> = {
  dashboard: { title: 'Resumen del gimnasio', name: 'Resumen', icon: 'dashboard' },
  members: { title: 'Miembros', name: 'Miembros', icon: 'members' },
  access: { title: 'Control de acceso', name: 'Control de acceso', icon: 'access' },
  payments: { title: 'Pagos e ingresos', name: 'Pagos e ingresos', icon: 'payments' },
  team: { title: 'Usuarios y permisos', name: 'Usuarios', icon: 'members' },
  plans: { title: 'Planes y tarifas', name: 'Planes y tarifas', icon: 'plans' },
  kiosk: { title: 'Quiosco de ingreso', name: 'Quiosco', icon: 'phone' },
  sell: { title: 'Venta rápida', name: 'Vender', icon: 'cart' },
  sales: { title: 'Ventas', name: 'Ventas', icon: 'cash' },
  products: { title: 'Productos', name: 'Productos', icon: 'tag' },
};

/** Pages used every day; always visible in the sidebar. */
export const mainPages: Page[] = ['dashboard', 'members', 'access', 'payments', 'sell', 'sales'];

/** Pages configured once; grouped behind the settings entry. */
export const settingsPages: Page[] = ['team', 'plans', 'products', 'kiosk'];

/** Pages offering "Nuevo miembro": enrolling happens only from the members module. */
export const enrollmentPages: Page[] = ['members'];

/**
 * Pages that belong to an optional module: they only exist for gyms that have it switched on. Each module's
 * piece adds its pages here (e.g. `kiosk: 'kiosk'`); the sidebar and the router then hide them by themselves.
 */
export const pageFeatures: Partial<Record<Page, GymFeature>> = { kiosk: 'kiosk', sell: 'sales', sales: 'sales', products: 'sales' };
