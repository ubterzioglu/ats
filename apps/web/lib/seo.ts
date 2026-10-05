import { routing, type AppLocale } from "@/i18n/routing";

import { SITE_ENTITY } from "@/lib/site-entity";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const PUBLIC_PATHS = ["/", "/analyze", "/builder", "/about"] as const;
export type PublicPath = (typeof PUBLIC_PATHS)[number];

export const OPEN_GRAPH_LOCALE: Readonly<Record<AppLocale, string>> = {
  en: "en_US",
  tr: "tr_TR",
  de: "de_DE"
};

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

export const BUILD_DATE = new Date().toISOString().slice(0, 10);

export const FAQ_IDS = ["upload", "score", "languages", "shared", "guarantee", "noAd"] as const;

export type JsonLdNode = Readonly<Record<string, unknown>>;

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

export function buildOrganizationJsonLd(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_ENTITY.name,
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: `${SITE_URL}${SITE_ENTITY.logoPath}` },
    ...(SITE_ENTITY.sameAs.length > 0 ? { sameAs: SITE_ENTITY.sameAs } : {}),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: SITE_ENTITY.contactEmail
    }
  };
}

export function buildHomeJsonLd(
  locale: AppLocale,
  name: string,
  description: string
): readonly JsonLdNode[] {
  const url = absoluteUrl(locale, "/");
  const organization = buildOrganizationJsonLd();
  return [
    organization,
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name,
      url,
      description,
      inLanguage: locale,
      publisher: { "@id": ORGANIZATION_ID },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/analyze?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name,
      url,
      description,
      inLanguage: locale,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any",
      publisher: { "@id": ORGANIZATION_ID },
      dateModified: BUILD_DATE
    }
  ] as const;
}

export function buildFaqJsonLd(
  items: readonly { readonly question: string; readonly answer: string }[]
): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer }
    }))
  };
}
