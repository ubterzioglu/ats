export const FEATURE_SLUGS = [
  "scoring",
  "parser-view",
  "job-ad",
  "matching",
  "tailor",
  "interview",
  "tracker",
  "cv-builder",
  "linkedin",
  "languages",
  "ai",
  "reports",
  "privacy",
  "history",
  "help"
] as const;

export type FeatureSlug = (typeof FEATURE_SLUGS)[number];

export type FeatureToolHref = "/analyze" | "/builder" | "/applications" | "/privacy";

/** Where a feature lives. Features without an entry are described on their own page only. */
export const FEATURE_TOOLS: Readonly<Partial<Record<FeatureSlug, FeatureToolHref>>> = {
  scoring: "/analyze",
  "parser-view": "/analyze",
  "job-ad": "/analyze",
  matching: "/analyze",
  tailor: "/analyze",
  interview: "/analyze",
  tracker: "/applications",
  "cv-builder": "/builder",
  languages: "/analyze",
  ai: "/analyze",
  reports: "/analyze",
  privacy: "/privacy",
  history: "/analyze"
};

export function isFeatureSlug(value: string): value is FeatureSlug {
  return (FEATURE_SLUGS as readonly string[]).includes(value);
}

export function featurePath(slug: FeatureSlug): `/features/${FeatureSlug}` {
  return `/features/${slug}`;
}

export function neighbours(slug: FeatureSlug): {
  readonly previous: FeatureSlug | null;
  readonly next: FeatureSlug | null;
} {
  const index = FEATURE_SLUGS.indexOf(slug);
  return {
    previous: FEATURE_SLUGS[index - 1] ?? null,
    next: FEATURE_SLUGS[index + 1] ?? null
  };
}
