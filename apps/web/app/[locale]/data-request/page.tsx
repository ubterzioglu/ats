import { getTranslations } from "next-intl/server";
import { DataRequestForm } from "@/components/data-request-form";

export default async function DataRequestPage() {
  const t = await getTranslations("dataRequest");

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold text-ink mb-4">{t("title")}</h1>
      <p className="text-muted mb-8">{t("description")}</p>
      <DataRequestForm />
    </div>
  );
}
