import type { DemoUser } from '@/features/auth';
import type { Organization, Gym, Branch } from '@/features/organization';
import type { Member } from '@/features/members';
import type { AccessEntry } from '@/features/access';
export interface DemoState { users: DemoUser[]; organizations: Organization[]; gyms: Gym[]; branches: Branch[]; members: Member[]; payments: Member[]; entries: AccessEntry[]; }
