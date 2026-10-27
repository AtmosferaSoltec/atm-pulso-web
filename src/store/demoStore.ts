import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';
import type { DemoState } from '@/types/demo.types';
import type { DemoUser } from '@/features/auth';
export interface DemoContextValue { state: DemoState; setState: Dispatch<SetStateAction<DemoState>>; currentUser: DemoUser | null; setCurrentUser: Dispatch<SetStateAction<DemoUser | null>>; }
export const DemoContext = createContext<DemoContextValue | null>(null);
export function useDemoStore(): DemoContextValue { const context = useContext(DemoContext); if (!context) throw new Error('DemoProvider is required'); return context; }
