import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/config/apiClient';
import { LoginPage, PasswordSetupPage } from '@/features/auth';
import { PlatformPage } from '@/features/platform';
import { CatalogProvider } from '@/features/organization';
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

function Application(): ReactElement {
  const { user, inspectedId, inspect, restoring } = useAuth();
  if (restoring) return <div className="empty">Cargando…</div>;
  if (!user) return <LoginPage />;
  if (user.must_change_password) return <PasswordSetupPage />;
  if (user.role === 'superadmin' && !inspectedId) {
    return (
      <PlatformPage
        onInspect={(id) => {
          inspect(id);
          window.location.hash = 'dashboard';
        }}
      />
    );
  }
  return (
    <CatalogProvider key={`${user.id}-${inspectedId ?? user.organization?.id}`}>
      <Workspace
        onBack={
          user.role === 'superadmin'
            ? () => {
                inspect(null);
                window.location.hash = 'clients';
              }
            : undefined
        }
      />
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
