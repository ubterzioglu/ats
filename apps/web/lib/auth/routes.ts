import { routing } from "@/i18n/routing";

export const PROTECTED_PREFIXES: readonly string[] = [
  "/analyze",
  "/builder",
  "/applications",
  "/api/cv",
  "/api/ghost-check"
];

const LOCALE_PREFIX = new RegExp(`^/(${routing.locales.join("|")})(/|$)`);

function stripLocale(pathname: string): string {
  return pathname.replace(LOCALE_PREFIX, "/") || "/";
}

export function isProtectedPath(pathname: string): boolean {
  const stripped = stripLocale(pathname);
  return PROTECTED_PREFIXES.some((prefix) => stripped === prefix || stripped.startsWith(prefix + "/"));
}

export function safeNext(value: string | null | undefined, locale: string): string {
  if (!value) return "/analyze";

  const trimmed = value.trim();
  if (!trimmed) return "/analyze";

  if (trimmed.startsWith("//") || trimmed.includes("://") || trimmed.startsWith("\\")) {
    return "/analyze";
  }

  if (!trimmed.startsWith("/")) return "/analyze";

  const stripped = stripLocale(trimmed);
  if (stripped.startsWith("/admin")) return "/analyze";

  if (isProtectedPath(trimmed)) {
    return withLocale("/login", locale) + `?next=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}

export function withLocale(path: string, locale: string): string {
  if (locale === routing.defaultLocale) return path;
  return `/${locale}${path}`;
}

interface DecideAccessInput {
  readonly pathname: string;
  readonly user: { readonly email_confirmed_at?: string | null } | null;
  readonly authConfigured: boolean;
}

export type AccessDecision =
  | { readonly action: "allow" }
  | { readonly action: "redirect"; readonly to: string };

export function decideAccess({ pathname, user, authConfigured }: DecideAccessInput): AccessDecision {
  if (!authConfigured) return { action: "allow" };
  if (!isProtectedPath(pathname)) return { action: "allow" };
  if (!user || !user.email_confirmed_at) {
    const locale = extractLocale(pathname);
    const loginPath = withLocale("/login", locale);
    return { action: "redirect", to: `${loginPath}?next=${encodeURIComponent(pathname)}` };
  }
  return { action: "allow" };
}

function extractLocale(pathname: string): string {
  const match = pathname.match(LOCALE_PREFIX);
  if (match?.[1]) return match[1];
  return routing.defaultLocale;
}
