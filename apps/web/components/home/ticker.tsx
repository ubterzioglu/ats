import { getTranslations } from "next-intl/server";

import { Sparkle } from "./sparkle";

const KEYS = ["parse", "keywords", "structure", "impact", "contact"] as const;

/**
 * A quiet strip under the hero that names the five things the score is made
 * of. It repeats the list twice so the loop has no seam; the second copy is
 * hidden from assistive technology.
 */
export async function Ticker() {
  const t = await getTranslations("home.demo");

  const items = KEYS.map((key) => (
    <li key={key} className="flex items-center gap-6 pr-6">
      <span className="font-display text-3xl font-bold text-bone/90 sm:text-5xl">{t(key)}</span>
      <Sparkle className="h-7 w-7 shrink-0 sm:h-9 sm:w-9" />
    </li>
  ));

  return (
    <div className="marquee border-y-2 border-bone/10 py-5">
      <div className="marquee-track">
        <ul className="flex shrink-0 items-center">{items}</ul>
        <ul className="flex shrink-0 items-center" aria-hidden="true">
          {items}
        </ul>
      </div>
    </div>
  );
}
