import { getTranslations } from "next-intl/server";

import { SectionHeadline } from "@/components/ui/section-headline";

interface FaqItem {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
}

interface FaqSectionProps {
  readonly items: readonly FaqItem[];
}

export async function FaqSection({ items }: FaqSectionProps) {
  const t = await getTranslations("faq");

  return (
    <section
      aria-labelledby="faq"
      className="mx-auto w-full max-w-page px-4 py-section-sm sm:px-6 lg:py-section"
    >
      <SectionHeadline id="faq" title={t("title")} />
      <div className="mt-10 space-y-4">
        {items.map((item) => (
          <details
            key={item.id}
            className="group rounded-surface border-2 border-bone/10 bg-bench px-5 py-4 transition-colors open:border-lime/70 sm:px-7 sm:py-5"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-lg font-semibold text-bone sm:text-xl">
              {item.question}
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-lime text-xl leading-none text-lime transition-transform duration-200 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-body text-mist">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
