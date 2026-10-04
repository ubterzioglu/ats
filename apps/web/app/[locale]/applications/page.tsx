import { getTranslations, setRequestLocale } from "next-intl/server";
import { KanbanBoard } from "@/components/kanban/board";

interface ApplicationsPageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export default async function ApplicationsPage({ params }: ApplicationsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("kanban");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-16">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-display font-semibold">{t("heading")}</h1>
          <p className="mt-2 text-base text-muted">{t("lede")}</p>
        </div>
      </header>

      <main>
        <KanbanBoard />
      </main>
    </div>
  );
}
