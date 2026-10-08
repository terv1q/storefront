/**
 * Where a visitor was going before they were asked to sign in.
 *
 * Both guard routes and both auth pages need this, and both need it to be safe:
 * a return path travels through a URL, and a URL is something a stranger can
 * write. An unchecked value would let `https://elsewhere.example` — or the
 * protocol-relative `//elsewhere.example`, which a browser reads as an absolute
 * address too — turn a sign-in on this store into a redirect off it.
 *
 * So a value is only accepted if it is a path on this origin: a single leading
 * slash, no scheme, no backslashes (which some browsers normalise to slashes),
 * no control characters, and not itself one of the pages that would send the
 * visitor straight back here. Anything else falls back to the storefront, which
 * is always a correct answer to "where next".
 */

import { useLocation } from 'react-router-dom';

import { paths } from './paths';

/** Pages a return path may not point at, because they redirect back to sign-in. */
const BLOCKED = [paths.login, paths.register] as const;

/**
 * A path that is safe to navigate to after signing in, or `fallback` when the
 * value is missing, external, or would bounce the visitor back to the form.
 */
export function safeReturnUrl(value: unknown, fallback: string = paths.home): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  const url = value.trim();

  if (url === '' || !url.startsWith('/') || url.startsWith('//')) {
    return fallback;
  }

  // A backslash is read as a slash by some browsers, so `/\evil.example` is the
  // same address as `//evil.example`.
  if (url.includes('\\') || url.includes('://')) {
    return fallback;
  }

  // A control character is stripped by the browser before it navigates,
  // which would turn a path that was refused here into one that is followed.
  for (const character of url) {
    if (character.charCodeAt(0) < 0x20) {
      return fallback;
    }
  }

  const path = url.split(/[?#]/)[0] ?? '';

  if (BLOCKED.some((blocked) => path === blocked)) {
    return fallback;
  }

  return url;
}

/** The sign-in address that carries where the visitor was trying to go. */
export function loginPathWithReturn(returnUrl: string): string {
  const safe = safeReturnUrl(returnUrl, '');

  return safe === '' ? paths.login : `${paths.login}?returnUrl=${encodeURIComponent(safe)}`;
}

/** The registration address that carries where the visitor was trying to go. */
export function registerPathWithReturn(returnUrl: string): string {
  const safe = safeReturnUrl(returnUrl, '');

  return safe === '' ? paths.register : `${paths.register}?returnUrl=${encodeURIComponent(safe)}`;
}

/**
 * The path to open after signing in.
 *
 * A guard that redirected here passes the path it interrupted as router state,
 * which is the more precise of the two: the state is the exact route, while the
 * query parameter is what survives a reload of the sign-in page. The state is
 * read first for that reason. Both go through `safeReturnUrl`, because either
 * can be written by whoever composed the link.
 */
export function useReturnUrl(): string {
  const location = useLocation();

  const state = location.state as { from?: unknown } | null;
  const fromState = safeReturnUrl(state?.from, '');

  if (fromState !== '') {
    return fromState;
  }

  const fromQuery = new URLSearchParams(location.search).get('returnUrl');

  return safeReturnUrl(fromQuery);
}

/**
 * The current page as a return path, for a component that sends a visitor to
 * sign in without a guard having interrupted them.
 */
export function useCurrentReturnUrl(): string {
  const location = useLocation();

  return safeReturnUrl(`${location.pathname}${location.search}`);
}
