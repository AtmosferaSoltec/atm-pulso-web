export type { DemoUser, UserRole } from '@/features/auth/types/auth.types';
export { LoginPage } from '@/features/auth/components/LoginPage';
export { ProfileDialog } from '@/features/auth/components/ProfileDialog';
export { demoUsers, DEMO_PASSWORD } from '@/features/auth/services/authData';
export { canOperate, canManageTeam, canManageGym, canAccessBranch, canWorkInBranch, canVisitPage } from '@/features/auth/services/permissions';
