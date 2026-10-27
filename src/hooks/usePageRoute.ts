import { useEffect, useState } from 'react';
import { pageDetails } from '@/config/pages';
import { canVisitPage } from '@/features/auth';
import type { SessionUser } from '@/types/api.types';
import type { Page } from '@/types/navigation.types';

function pageFromHash(): Page | null {
  const hash = window.location.hash.slice(1);
  if (hash === 'renewals') return 'members';
  return Object.hasOwn(pageDetails, hash) ? (hash as Page) : null;
}

/** Keeps the current page in sync with the URL hash, honouring the user's permissions. */
export function usePageRoute(user: SessionUser): { page: Page; goTo: (next: Page) => void } {
  const fallback: Page = user.role === 'receptionist' ? 'access' : 'dashboard';
  const resolve = (): Page => {
    const requested = pageFromHash();
    return requested && canVisitPage(user, requested) ? requested : fallback;
  };
  const [page, setPage] = useState<Page>(resolve);

  useEffect(() => {
    const onHashChange = (): void => setPage(resolve());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, fallback]);

  function goTo(next: Page): void {
    if (!canVisitPage(user, next)) return;
    setPage(next);
    window.location.hash = next;
  }

  return { page, goTo };
}
