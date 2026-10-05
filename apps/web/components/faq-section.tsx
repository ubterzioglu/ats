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
          <details key={item.id} className="group border-b border-line pb-4">
            <summary className="cursor-pointer list-none text-body font-normal text-bone">
              {item.question}
            </summary>
            <p className="mt-3 max-w-lede text-body font-extralight text-mist">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
