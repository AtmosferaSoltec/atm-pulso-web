import { useEffect, useState, type ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/config/apiClient';
import { LoginPage } from '@/features/auth';
import { CatalogProvider } from '@/features/gym';
import { KioskRoute, isKioskPath } from '@/features/kiosk';
import { Workspace } from '@/layouts/Workspace';
import { AuthProvider } from '@/store/AuthProvider';
import { useAuth } from '@/store/authStore';
import '@/App.css';
import '@/assets/brand.css';
import '@/assets/simple.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // A client error (4xx) will not change by asking again; a network blip may.
      retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 1,
    },
    mutations: { retry: false },
  },
});

/** The kiosk is a route of its own (/kiosk); everything else is the workspace, which routes by hash. */
function useKioskRoute(): boolean {
  const [kiosk, setKiosk] = useState(() => isKioskPath(window.location.pathname));
  useEffect(() => {
    const onChange = (): void => setKiosk(isKioskPath(window.location.pathname));
    window.addEventListener('popstate', onChange);
    return () => window.removeEventListener('popstate', onChange);
  }, []);
  return kiosk;
}

function Application(): ReactElement {
  const { user, restoring } = useAuth();
  const kiosk = useKioskRoute();
  if (restoring) return <div className="empty">Cargando…</div>;
  if (!user) return <LoginPage />;
  return (
    <CatalogProvider key={`${user.id}-${user.gym.id}`}>
      {kiosk ? <KioskRoute /> : <Workspace />}
    </CatalogProvider>
  );
}

export default function App(): ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Application />
      </AuthProvider>
    </QueryClientProvider>
  );
}
