import { routing, type AppLocale } from "@/i18n/routing";
import { FEATURE_SLUGS, featurePath } from "@/lib/features";

import { SITE_ENTITY } from "@/lib/site-entity";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const STATIC_PATHS = [
  "/",
  "/about",
  "/privacy",
  "/kvkk",
  "/data-request",
  "/blog",
  "/features",
  "/faq",
  "/quick-test"
] as const;
export type PublicPath = (typeof STATIC_PATHS)[number] | ReturnType<typeof featurePath>;
export const PUBLIC_PATHS: readonly PublicPath[] = [...STATIC_PATHS, ...FEATURE_SLUGS.map(featurePath)];

export const OPEN_GRAPH_LOCALE: Readonly<Record<AppLocale, string>> = {
  en: "en_US",
  tr: "tr_TR",
  de: "de_DE"
};

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const BUILD_DATE = new Date().toISOString().slice(0, 10);

export const FAQ_IDS = ["upload", "score", "languages", "shared", "guarantee", "noAd", "formats", "retention", "delete", "accuracy"] as const;

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

export function buildOrganizationJsonLd(description: string): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_ENTITY.name,
    alternateName: ["affa", "ats free for all"],
    url: SITE_URL,
    description,
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
  const organization = buildOrganizationJsonLd(description);
  return [
    organization,
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": WEBSITE_ID,
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

export function buildBreadcrumbJsonLd(
  locale: AppLocale,
  path: PublicPath,
  label: string,
  homeLabel: string
): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: homeLabel,
        item: absoluteUrl(locale, "/")
      },
      {
        "@type": "ListItem",
        position: 2,
        name: label,
        item: absoluteUrl(locale, path)
      }
    ]
  };
}

export function buildAboutPageJsonLd(
  locale: AppLocale,
  name: string,
  description: string
): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name,
    description,
    url: absoluteUrl(locale, "/about"),
    inLanguage: locale,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANIZATION_ID }
  };
}

export function buildHowToJsonLd(
  steps: readonly { readonly name: string; readonly text: string }[]
): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to analyze your CV with ATS readability",
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text
    }))
  };
}

export function buildBlogPostingJsonLd(
  locale: AppLocale,
  slug: string,
  title: string,
  description: string,
  publishedAt: string,
  authorEmail?: string
): JsonLdNode {
  const url = `${SITE_URL}/${locale}/blog/${slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    url,
    datePublished: publishedAt,
    inLanguage: locale,
    publisher: { "@id": ORGANIZATION_ID },
    ...(authorEmail ? { author: { "@type": "Person", email: authorEmail } } : {})
  };
}

export function buildBlogBreadcrumbJsonLd(
  locale: AppLocale,
  slug: string,
  title: string
): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl(locale, "/")
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: absoluteUrl(locale, "/blog")
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: `${SITE_URL}/${locale}/blog/${slug}`
      }
    ]
  };
}
