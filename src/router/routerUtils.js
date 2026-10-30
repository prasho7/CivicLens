/**
 * Hash router utilities + hooks (non-component exports).
 * Kept separate from NavLink component to satisfy react-refresh rules.
 */
import { useState, useEffect } from 'react';

export function getHash() {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  return hash.startsWith('/') ? hash : '/' + hash;
}

export function navigate(to) {
  window.location.hash = to;
}

/**
 * Parse route match from a hash path string.
 * Returns { route, params }.
 */
export function matchRoute(path) {
  const p = path.replace(/\/$/, '') || '/';
  if (p === '/' || p === '/dashboard') return { route: 'dashboard', params: {} };
  if (p === '/report') return { route: 'report', params: {} };
  const trackMatch = p.match(/^\/track\/(.+)$/);
  if (trackMatch) return { route: 'track', params: { reportId: trackMatch[1] } };
  return { route: 'notfound', params: {} };
}

/**
 * Hook to track the current hash path.
 */
export function useRouter() {
  const [path, setPath] = useState(getHash);

  useEffect(() => {
    const onHashChange = () => setPath(getHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return path;
}
