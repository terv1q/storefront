import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Returns the viewport to the top when the route changes, so a new page never opens mid-scroll. */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}
