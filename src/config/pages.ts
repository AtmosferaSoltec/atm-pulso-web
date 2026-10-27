import type { IconName } from '@/components/ui/icon';
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
  organization: { title: 'Gimnasios y reglas', name: 'Gimnasios y reglas', icon: 'shield' },
  team: { title: 'Usuarios y permisos', name: 'Usuarios', icon: 'members' },
  branding: { title: 'Identidad del gimnasio', name: 'Identidad', icon: 'tag' },
};

/** Pages used every day; always visible in the sidebar. */
export const mainPages: Page[] = ['dashboard', 'members', 'access', 'payments'];

/** Pages configured once; grouped behind the settings entry. */
export const settingsPages: Page[] = ['organization', 'team', 'branding'];

/** Pages where registering a new member makes sense. */
export const enrollmentPages: Page[] = ['dashboard', 'members', 'access', 'payments'];
