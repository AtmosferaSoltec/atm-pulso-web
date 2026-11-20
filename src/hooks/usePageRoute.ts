import { useEffect, useState } from 'react';
import { pageDetails } from '@/config/pages';
import { buildHash, parseHash } from '@/config/routeHash';
import { canVisitPage } from '@/features/auth';
import { useGymFeatures } from '@/features/gym';
import type { SessionUser } from '@/types/api.types';
import type { Page } from '@/types/navigation.types';

interface Route {
  page: Page;
  /** Set on `#members/<id>`: the page of one member. */
  memberId: string | null;
}

function routeFromHash(): { page: Page; memberId: string | null } | null {
  const { segment, param } = parseHash(window.location.hash);
  if (segment === 'renewals') return { page: 'members', memberId: null };
  if (!Object.hasOwn(pageDetails, segment)) return null;
  return { page: segment as Page, memberId: segment === 'members' ? param : null };
}

/** Keeps the current page (and member, in `#members/<id>`) in sync with the URL hash, honouring the user's permissions. */
export function usePageRoute(user: SessionUser): { page: Page; memberId: string | null; goTo: (next: Page) => void; openMember: (id: string) => void } {
  const features = useGymFeatures();
  const fallback: Page = user.role === 'receptionist' ? 'access' : 'dashboard';
  const resolve = (): Route => {
    const requested = routeFromHash();
    return requested && canVisitPage(user, requested.page, features) ? requested : { page: fallback, memberId: null };
  };
  const [route, setRoute] = useState<Route>(resolve);

  useEffect(() => {
    const onHashChange = (): void => setRoute(resolve());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, fallback, features]);

  function goTo(next: Page): void {
    if (!canVisitPage(user, next, features)) return;
    setRoute({ page: next, memberId: null });
    window.location.hash = next;
  }

  /** Each member page is a history entry: the browser's back returns to where the user was. */
  function openMember(id: string): void {
    if (!canVisitPage(user, 'members', features)) return;
    setRoute({ page: 'members', memberId: id });
    window.location.hash = buildHash('members', id);
  }

  return { page: route.page, memberId: route.memberId, goTo, openMember };
}
