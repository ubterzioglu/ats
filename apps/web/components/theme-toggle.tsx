"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { isThemeChoice, THEME_STORAGE_KEY, type ThemeChoice } from "@/lib/theme";
import { cx } from "@/lib/ui";

const CHOICES: readonly ThemeChoice[] = ["light", "system", "dark"];

function read(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeChoice(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function apply(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);

  try {
    if (choice === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // Private browsing refuses storage. The choice still applies to this page.
  }
}

/**
 * Three states rather than two, because "follow the system" is a real answer
 * and a two-way switch cannot get back to it once it has been touched.
 *
 * Rendered only after mount: the server cannot know which choice is stored, and
 * marking the wrong one as current would be worse than a frame of nothing.
 */
export function ThemeToggle() {
  const t = useTranslations("theme");
  const [choice, setChoice] = useState<ThemeChoice | null>(null);

  useEffect(() => {
    setChoice(read());
  }, []);

  if (choice === null) {
    // Matches the mounted control's box, so choosing a theme does not shift the
    // header under the reader's cursor.
    return <div className="h-11 w-[11rem]" aria-hidden />;
  }

  return (
    <div
      role="radiogroup"
      aria-label={t("label")}
      className="inline-flex rounded-control border border-line bg-bench p-0.5"
    >
      {CHOICES.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={choice === option}
          onClick={() => {
            setChoice(option);
            apply(option);
          }}
          className={cx(
            "inline-flex min-h-11 items-center rounded-chip px-3 text-micro transition-colors",
            choice === option ? "bg-ink text-bench" : "text-muted hover:text-ink"
          )}
        >
          {t(option)}
        </button>
      ))}
    </div>
  );
}
