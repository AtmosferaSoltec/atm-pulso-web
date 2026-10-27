import { useState, type ReactElement } from 'react';
import { LoginPage } from '@/features/auth';
import { PlatformPage } from '@/features/platform';
import { Workspace } from '@/layouts/Workspace';
import { DemoProvider } from '@/store/DemoProvider';
import { useDemoStore } from '@/store/demoStore';
import '@/App.css';
import '@/assets/brand.css';
import '@/assets/simple.css';
function Application(): ReactElement {
 const { currentUser, setCurrentUser, state } = useDemoStore();
 const [inspectedId, setInspectedId] = useState<string | null>(null);
 function logout(): void { setCurrentUser(null); setInspectedId(null); window.location.hash = 'login'; }
 if (!currentUser) return <LoginPage onLogin={user => { setCurrentUser(user); setInspectedId(null); window.location.hash = user.role === 'receptionist' ? 'access' : user.role === 'superadmin' ? 'clients' : 'dashboard'; }} />;
 if (currentUser.role === 'superadmin' && (!inspectedId || !state.organizations.some(item => item.id === inspectedId))) return <PlatformPage onInspect={id => { setInspectedId(id); window.location.hash = 'dashboard'; }} onLogout={logout} />;
 return <Workspace key={`${currentUser.id}-${inspectedId ?? currentUser.organizationId}`} user={currentUser} organizationId={currentUser.role === 'superadmin' ? inspectedId! : currentUser.organizationId} onLogout={logout} onBack={currentUser.role === 'superadmin' ? () => { setInspectedId(null); window.location.hash = 'clients'; } : undefined} />;
}
export default function App(): ReactElement { return <DemoProvider><Application /></DemoProvider>; }
