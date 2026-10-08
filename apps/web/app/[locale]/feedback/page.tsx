import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { FeedbackForm } from "@/components/feedback-form";

interface FeedbackPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: FeedbackPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "feedback" });
  return { title: t("title"), robots: { index: false, follow: true } };
}

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "feedback" });

  return (
    <div className="mx-auto w-full max-w-page px-4 py-12 sm:px-6">
      <h1 className="mb-4 text-3xl font-bold text-ink">{t("title")}</h1>
      <p className="mb-8 text-muted">{t("description")}</p>
      <div className="max-w-2xl">
        <FeedbackForm />
      </div>
    </div>
  );
}
