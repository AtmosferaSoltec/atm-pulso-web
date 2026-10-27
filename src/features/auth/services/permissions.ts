import type { DemoUser } from '@/features/auth/types/auth.types';
import type { Page } from '@/types/navigation.types';
export function canOperate(user: DemoUser | null, organizationId: string): boolean { return !!user && user.active !== false && user.role !== 'superadmin' && user.organizationId === organizationId; }
export function canManageAccount(user: DemoUser | null, organizationId: string): boolean { return canOperate(user, organizationId) && user?.role === 'admin'; }
export function canVisitPage(user: DemoUser, page: Page): boolean { return user.role !== 'receptionist' || ['members', 'access', 'payments'].includes(page); }
