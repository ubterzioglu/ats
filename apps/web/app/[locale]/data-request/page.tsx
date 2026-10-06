import { getTranslations } from "next-intl/server";
import { DataRequestForm } from "@/components/data-request-form";

export default async function DataRequestPage() {
  const t = await getTranslations("dataRequest");

  return (
    <div className="mx-auto w-full max-w-page px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-ink mb-4">{t("title")}</h1>
      <p className="text-muted mb-8">{t("description")}</p>
      <div className="max-w-2xl">
        <DataRequestForm />
      </div>
    </div>
  );
}
