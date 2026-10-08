import { Link } from "@/i18n/navigation";
import { FEATURE_SLUGS, featurePath } from "@/lib/features";
import type { FeatureContent } from "@/lib/features/content";

interface FeatureGridProps {
  readonly content: FeatureContent;
  readonly labelledBy?: string;
}

/** One card per feature, each linking to its own page. Used on the landing page and the index. */
export function FeatureGrid({ content, labelledBy }: FeatureGridProps) {
  return (
    <ul aria-labelledby={labelledBy} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURE_SLUGS.map((slug) => {
        const entry = content[slug];
        return (
          <li key={slug}>
            <Link
              href={featurePath(slug)}
              className="group flex h-full flex-col rounded-2xl border-2 border-bone/15 p-5 transition-colors hover:border-lime/60 focus-visible:border-lime"
            >
              <span className="font-display text-lg font-bold text-bone">{entry.title}</span>
              <span className="mt-2 text-sm leading-relaxed text-mist">{entry.summary}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
