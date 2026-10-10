export interface CanonicalHostInput {
  readonly host: string | null | undefined;
  readonly pathname: string;
  readonly search: string;
  readonly siteUrl: string | null | undefined;
}

function parseSite(siteUrl: string | null | undefined): URL | null {
  if (!siteUrl) return null;
  try {
    return new URL(siteUrl);
  } catch {
    return null;
  }
}

/**
 * The URL a www request should move to, or null when it is already on the
 * canonical host. Only the www twin of the configured site host is redirected,
 * so localhost, preview hosts and a www-canonical setup pass through untouched.
 * The proxy normally does this; the check keeps duplicate hosts out of the
 * index if that setting is ever lost.
 */
export function canonicalHostRedirect(input: CanonicalHostInput): string | null {
  const site = parseSite(input.siteUrl);
  if (!site || site.hostname.startsWith("www.")) return null;

  const host = input.host?.split(",")[0]?.trim().toLowerCase();
  if (!host) return null;

  const hostname = host.split(":")[0];
  if (hostname !== `www.${site.hostname}`) return null;

  return `${site.origin}${input.pathname}${input.search}`;
}
