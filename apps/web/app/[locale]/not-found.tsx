import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-2xl flex-col justify-center px-4 py-12 sm:px-6">
      <p className="font-mono text-micro tabular-nums text-muted">{t("code")}</p>
      <h1 className="mt-2 text-heading-sm font-normal">{t("heading")}</h1>
      <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{t("body")}</p>
      <p className="mt-6">
        <Link className="btn" href="/">
          {t("cta")}
        </Link>
      </p>
    </main>
  );
}
