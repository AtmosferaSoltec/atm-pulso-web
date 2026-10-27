import { useState, type ReactNode, type ReactElement } from 'react';
import { DemoContext } from '@/store/demoStore';
import { demoUsers, type DemoUser } from '@/features/auth';
import { initialOrganizations, gyms, branches } from '@/features/organization';
import { initialMembers } from '@/features/members';
import type { DemoState } from '@/types/demo.types';
export function DemoProvider({ children }: { children: ReactNode }): ReactElement {
 const [state, setState] = useState<DemoState>(() => ({ users: demoUsers, organizations: initialOrganizations, gyms, branches, members: initialMembers, payments: initialMembers, entries: [] }));
 const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
 return <DemoContext value={{ state, setState, currentUser, setCurrentUser }}>{children}</DemoContext>;
}
