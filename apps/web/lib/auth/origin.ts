const UNROUTABLE_HOSTS: readonly string[] = ["0.0.0.0", "[::]", "::"];

export interface OriginInput {
  readonly url: string;
  readonly forwardedHost?: string | null;
  readonly forwardedProto?: string | null;
  readonly siteUrl?: string | null;
}

function hostnameOf(host: string): string {
  return host.startsWith("[") ? host.slice(0, host.indexOf("]") + 1) : (host.split(":")[0] ?? host);
}

function siteOrigin(siteUrl: string | null | undefined): string | null {
  if (!siteUrl) return null;
  try {
    return new URL(siteUrl).origin;
  } catch {
    return null;
  }
}

/**
 * The origin a visitor actually used. The standalone server inside the
 * container binds to HOSTNAME=0.0.0.0, so `request.url` can carry that
 * address instead of the public host; a redirect built from it sends the
 * browser to https://0.0.0.0:3000. Prefer the proxy's forwarded headers, and
 * fall back to the configured site URL when the host is not routable.
 */
export function publicOrigin(input: OriginInput): string {
  const fallback = siteOrigin(input.siteUrl);
  const forwarded = input.forwardedHost?.split(",")[0]?.trim();

  if (forwarded && !UNROUTABLE_HOSTS.includes(hostnameOf(forwarded))) {
    const proto = input.forwardedProto?.split(",")[0]?.trim() || new URL(input.url).protocol.replace(":", "");
    return `${proto}://${forwarded}`;
  }

  const own = new URL(input.url);
  if (!UNROUTABLE_HOSTS.includes(hostnameOf(own.host))) return own.origin;

  return fallback ?? own.origin;
}

export function requestOrigin(request: {
  readonly url: string;
  readonly headers: { get(name: string): string | null };
}): string {
  return publicOrigin({
    url: request.url,
    forwardedHost: request.headers.get("x-forwarded-host"),
    forwardedProto: request.headers.get("x-forwarded-proto"),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL
  });
}
