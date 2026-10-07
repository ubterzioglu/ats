"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import type { DocumentLanguage } from "@/types/analysis";
import {
  ACTION_VERB_LIBRARY,
  type ActionVerbCategory
} from "@/lib/scoring/data/action-verbs";
import { cx } from "@/lib/ui";

interface ActionVerbPanelProps {
  readonly language?: DocumentLanguage;
}

const CATEGORIES: readonly (ActionVerbCategory | "all")[] = [
  "all",
  "leadership",
  "implementation",
  "optimization",
  "analysis",
  "communication"
];

export function ActionVerbPanel({ language = "en" }: ActionVerbPanelProps) {
  const t = useTranslations("actionVerbPanel");
  const [selectedCategory, setSelectedCategory] = useState<ActionVerbCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [copiedVerb, setCopiedVerb] = useState<string | null>(null);

  const langVerbs = useMemo(() => {
    return ACTION_VERB_LIBRARY.filter((item) => item.language === language);
  }, [language]);

  const filteredVerbs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return langVerbs.filter((item) => {
      const categoryMatch = selectedCategory === "all" || item.category === selectedCategory;
      const queryMatch = q.length === 0 || item.verb.toLowerCase().includes(q);
      return categoryMatch && queryMatch;
    });
  }, [langVerbs, selectedCategory, query]);

  const copyToClipboard = async (verb: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(verb);
        setCopiedVerb(verb);
        setTimeout(() => setCopiedVerb((current) => (current === verb ? null : current)), 2000);
      }
    } catch {
      // Degrade gracefully if clipboard permissions are restricted
    }
  };

  const categoryLabel = (cat: ActionVerbCategory | "all"): string => {
    switch (cat) {
      case "all":
        return t("categoryAll");
      case "leadership":
        return t("categoryLeadership");
      case "implementation":
        return t("categoryImplementation");
      case "optimization":
        return t("categoryOptimization");
      case "analysis":
        return t("categoryAnalysis");
      case "communication":
        return t("categoryCommunication");
    }
  };

  return (
    <section className="bench" aria-labelledby="action-verbs-heading">
      <div className="border-b border-line px-5 py-5 sm:px-6">
        <h2 id="action-verbs-heading" className="text-h3 font-normal">
          {t("heading")}
        </h2>
        <p className="mt-1 text-sm text-muted">{t("lede")}</p>
      </div>

      <div className="border-b border-line px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="w-full rounded-control border border-line bg-sheet px-3 py-1.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none sm:max-w-xs"
          />

          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Action verb categories">
            {CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={cx(
                    "rounded-full border px-2.5 py-1 text-micro transition-colors",
                    active
                      ? "border-ink bg-ink text-bed"
                      : "border-line text-muted hover:border-ink hover:text-ink"
                  )}
                  aria-pressed={active}
                >
                  {categoryLabel(category)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6">
        {filteredVerbs.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {filteredVerbs.map(({ verb, category }) => {
              const isCopied = copiedVerb === verb;
              return (
                <li key={`${verb}-${category}`}>
                  <button
                    type="button"
                    onClick={() => void copyToClipboard(verb)}
                    title={isCopied ? t("copied") : `Click to copy "${verb}"`}
                    className={cx(
                      "group flex items-center gap-1.5 rounded-control border px-2.5 py-1 font-mono text-xs transition-colors",
                      isCopied
                        ? "border-good bg-good/10 text-good"
                        : "border-line text-ink hover:border-signal hover:text-signal"
                    )}
                  >
                    <span>{verb}</span>
                    {isCopied ? (
                      <span className="text-micro font-sans opacity-90">✓</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted">{t("empty")}</p>
        )}
      </div>
    </section>
  );
}
