import { routing, type AppLocale } from "@/i18n/routing";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const PUBLIC_PATHS = ["/", "/analyze", "/builder"] as const;
export type PublicPath = (typeof PUBLIC_PATHS)[number];

export const OPEN_GRAPH_LOCALE: Readonly<Record<AppLocale, string>> = {
  en: "en_US",
  tr: "tr_TR",
  de: "de_DE"
};

export function localizedPath(locale: AppLocale, path: PublicPath): string {
  if (locale === routing.defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

export function absoluteUrl(locale: AppLocale, path: PublicPath): string {
  return `${SITE_URL}${localizedPath(locale, path)}`;
}

export function pageAlternates(
  locale: AppLocale,
  path: PublicPath
): { readonly canonical: string; readonly languages: Readonly<Record<string, string>> } {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = absoluteUrl(l, path);
  languages["x-default"] = absoluteUrl(routing.defaultLocale, path);
  return { canonical: absoluteUrl(locale, path), languages };
}

interface JsonLdNode {
  readonly "@context": string;
  readonly "@type": string;
  readonly name: string;
  readonly url: string;
  readonly description: string;
  readonly inLanguage: string;
  readonly applicationCategory?: string;
  readonly operatingSystem?: string;
}

export function buildHomeJsonLd(
  locale: AppLocale,
  name: string,
  description: string
): readonly JsonLdNode[] {
  const url = absoluteUrl(locale, "/");
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name,
      url,
      description,
      inLanguage: locale
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name,
      url,
      description,
      inLanguage: locale,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any"
    }
  ] as const;
}
